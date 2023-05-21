import assert from 'assert';
import {
  // BPP_PAL,
  // BPP_RGBA,
  MILLI_IN_SEC,
} from '../common';

import { mainConfig } from '../config/mainConfig';
import * as utils from './utils';
import { StatsNames, StatsValues } from '../ui/stats/stats';
import { AssetManager } from './assets/assetManager';
import PanelCommands from '../panels/enginePanelCommands';
import { KeyCode } from './input/inputManager';
import { EngineWorkerParams, EngineWorkerCommands } from './engineWorker';
import { WasmEngine, WasmEngineParams } from './wasmEngine/wasmEngine';

type EngineParams = {
  canvas: OffscreenCanvas;
};

class Engine {
  private static readonly RENDER_PERIOD_MS = MILLI_IN_SEC / mainConfig.targetRPS;
  private static readonly UPDATE_PERIOD_MS =
    (mainConfig.multiplier * MILLI_IN_SEC) / mainConfig.targetUPS;

  private static readonly UPDATE_TIME_MAX = Engine.UPDATE_PERIOD_MS * 8;

  private static readonly STATS_LEN = 10; // fps, rps, ups
  private static readonly FRAME_TIMES_LEN = 20; // used for ufps
  private static readonly TIMES_SINCE_LAST_FRAME_LEN = 10; // update, render

  private static readonly STATS_PERIOD_MS = 100; // MILLI_IN_SEC;

  private params: EngineParams;
  private wasmEngine: WasmEngine;
  private assetManager: AssetManager;

  private auxWorkers: Worker[];
  private syncArray: Int32Array;
  private sleepArray: Int32Array;

  public async init(params: EngineParams): Promise<void> {
    this.params = params;
    await this.initAssetManager();
    const numWorkers = mainConfig.numAuxWorkers;
    console.log(`Using 1 main engine worker plus ${numWorkers} auxiliary engine workers`);
    const numTotalWorkers = numWorkers + 1;
    this.syncArray = new Int32Array(new SharedArrayBuffer(numTotalWorkers * Int32Array.BYTES_PER_ELEMENT));
    this.sleepArray = new Int32Array(new SharedArrayBuffer(numTotalWorkers * Int32Array.BYTES_PER_ELEMENT));
    this.auxWorkers = [];
    if (numWorkers > 0) {
      await this.initAuxWorkers(numWorkers);
    }
    await this.initWasmEngine();
  }
  
  private async initWasmEngine() {
    this.wasmEngine = new WasmEngine();
    const wasmEngineParams: WasmEngineParams = {
      canvas: this.params.canvas,
      assetManager: this.assetManager,
      auxWorkers: this.auxWorkers,
      runLoopInWorker: true,
    };
    await this.wasmEngine.init(wasmEngineParams);
  }

  private async initAssetManager() {
    this.assetManager = new AssetManager();
    await this.assetManager.init();
  }

  private async initAuxWorkers(numWorkers: number) {
    assert(numWorkers > 0);
    let remWorkers = numWorkers;
    const initStart = Date.now();
    try {
      await new Promise<void>((resolve, reject) => {
        for (
        let workerIndex = 1; // 0 is reserved for main worker
        workerIndex <= numWorkers;
        ++workerIndex
      ) {
          const worker = new Worker(
            new URL('./engineWorker.ts', import.meta.url),
            {
              name: `engine-worker-${workerIndex}`,
              type: 'module',
            },
          );
          this.auxWorkers.push(worker);
          const workerParams: EngineWorkerParams = {
            workerIndex,
            numWorkers,
            syncArray: this.syncArray,
            sleepArray: this.sleepArray,
          };
          worker.postMessage({
            command: EngineWorkerCommands.INIT,
            params: workerParams,
          });
          worker.onmessage = ({ data }) => {
            --remWorkers;
            console.log(
              `Worker id=${workerIndex} init, left count=${remWorkers}, time=${
Date.now() - initStart
}ms with data = ${JSON.stringify(data)}`,
            );
            if (remWorkers === 0) {
              console.log(
                `Workers init done. After ${Date.now() - initStart}ms`,
              );
              resolve();
            }
          };
          worker.onerror = (error) => {
            console.log(`Worker id=${workerIndex} error: ${error.message}\n`);
            reject(error);
          };
        }
      });
    } catch (error) {
      console.error(`Error during workers init: ${JSON.stringify(error)}`);
    }
  }

  public run(): void {

    let lastFrameStartTime: number;
    // let last_render_t: number;
    let updTimeAcc: number;
    let renderTimeAcc: number;
    let elapsedTimeMs: number;
    let renderThen: number;
    let timeSinceLastFrame: number;
    let avgTimeLastFrame: number;
    let frameStartTime: number;

    let timeLastFrameCnt: number;
    let frameCnt: number;
    let renderCnt: number;
    let updateCnt: number;
    let statsCnt: number;

    let lastStatsTime: number;
    let statsTimeAcc: number;

    let frameTimeArr: Float64Array;
    let timeSinceLastFrameArr: Float64Array;
    let fpsArr: Float32Array;
    let rpsArr: Float32Array;
    let upsArr: Float32Array;

    let resync: boolean;
    let isRunning: boolean;
    let isPaused: boolean;

    const mainLoopInit = () => {
      lastFrameStartTime = lastStatsTime = renderThen = performance.now();
      frameTimeArr = new Float64Array(Engine.FRAME_TIMES_LEN);
      updTimeAcc = 0;
      renderTimeAcc = 0;
      elapsedTimeMs = 0;
      timeSinceLastFrameArr = new Float64Array(
        Engine.TIMES_SINCE_LAST_FRAME_LEN,
      );
      frameCnt = 0;
      timeLastFrameCnt = 0;
      statsTimeAcc = 0;
      fpsArr = new Float32Array(Engine.STATS_LEN);
      rpsArr = new Float32Array(Engine.STATS_LEN);
      upsArr = new Float32Array(Engine.STATS_LEN);
      statsCnt = 0;
      resync = false;
      updateCnt = 0;
      renderCnt  = 0;
      isRunning = true;
      isPaused = false;
      requestAnimationFrame(frame);
    };

    requestAnimationFrame(mainLoopInit);

    const begin = () => {
      frameStartTime = performance.now();
      timeSinceLastFrame = frameStartTime - lastFrameStartTime;
      lastFrameStartTime = frameStartTime;
      timeSinceLastFrame = Math.min(timeSinceLastFrame, Engine.UPDATE_TIME_MAX);
      timeSinceLastFrame = Math.max(timeSinceLastFrame, 0);
      timeSinceLastFrameArr[timeLastFrameCnt++ % timeSinceLastFrameArr.length] =
        timeSinceLastFrame;
      avgTimeLastFrame= utils.arrAvg(
        timeSinceLastFrameArr,
        timeLastFrameCnt,
      );
    }

    const next = () => {
      requestAnimationFrame(frame);
    }

    const frame = () => {
      begin();
      update();
      render();
      stats();
      next();
    };

    const update = () => {
      // if (is_paused) return; // TODO
      updTimeAcc += avgTimeLastFrame;
      // handle timer anomalies
      // spiral of death protection
      if (updTimeAcc > Engine.UPDATE_TIME_MAX) {
        resync = true;
      }
      // timer resync if requested
      if (resync) {
        updTimeAcc = 0; // TODO
        // delta_time = App.UPD_PERIOD;
      }
      while (updTimeAcc >= Engine.UPDATE_PERIOD_MS) {
        // TODO: see multiplier in update_period def
        // update state with UPDATE_PERIOD_MS
        // updateState(STEP, t / MULTIPLIER);
        updTimeAcc -= Engine.UPDATE_PERIOD_MS;
        updateCnt++;
      }
    };

    const saveFrameTime = () => {
      const frameTime = performance.now() - frameStartTime;
      frameTimeArr[renderCnt++ % frameTimeArr.length] = frameTime;
    };  

    const render = () => {
      renderTimeAcc += avgTimeLastFrame;
      if (renderTimeAcc >= Engine.RENDER_PERIOD_MS) {
        renderTimeAcc %= Engine.RENDER_PERIOD_MS;
        // this.syncWorkers();
        // this.waitWorkers();
        this.wasmEngine.render();
        saveFrameTime();
      }
    };

    const stats = () => {
      ++frameCnt;
      statsTimeAcc += timeSinceLastFrame;
      if (statsTimeAcc >= Engine.STATS_PERIOD_MS) {
        statsTimeAcc = 0;
        // const tspent = (tnow - start_time) / App.MILLI_IN_SEC;
        const now = performance.now();
        const elapsed = now - lastStatsTime;
        lastStatsTime = now;
        elapsedTimeMs += elapsed;
        const oneOverElapsed = MILLI_IN_SEC / elapsedTimeMs;
        const fps = frameCnt * oneOverElapsed;
        const rps = renderCnt * oneOverElapsed;
        const ups = updateCnt * oneOverElapsed;
        // console.log(`${fps} - ${rps} - ${ups}`);
        const st_idx = statsCnt++ % fpsArr.length;
        fpsArr[st_idx] = fps;
        rpsArr[st_idx] = rps;
        upsArr[st_idx] = ups;
        const avgFps = utils.arrAvg(fpsArr, statsCnt);
        const avgRps = utils.arrAvg(rpsArr, statsCnt);
        const avgUps = utils.arrAvg(upsArr, statsCnt);
        const avgFrameTime = utils.arrAvg(frameTimeArr, renderCnt);
        let avgUFps = avgFrameTime === 0 ? 0 : MILLI_IN_SEC / avgFrameTime;
        const stats: StatsValues = {
          [StatsNames.FPS]: avgFps,
          [StatsNames.RPS]: avgRps,
          [StatsNames.UPS]: avgUps,
          [StatsNames.UFPS]: avgUFps,
        };
        postMessage({
          command: PanelCommands.UPDATE_STATS,
          params: stats,
        });
      }
    };

    // TODO: test events
    // setInterval(() => {
    //   // console.log('sending...');
    //   postMessage({
    //     command: PanelCommands.EVENT,
    //     params: Math.floor(Math.random() * 100),
    //   });
    // }, 2000);
  }

  private syncWorkers() {
    for (let i = 1; i <= this.auxWorkers.length; ++i) {
      Atomics.store(this.syncArray, i, 1);
      Atomics.notify(this.syncArray, i);
    }
  }

  private waitWorkers() {
    for (let i = 1; i <= this.auxWorkers.length; ++i) {
      Atomics.wait(this.syncArray, i, 1);
    }
  }

  public onKeyDown(key: KeyCode) {
    this.wasmEngine.onKeyDown(key);
  }

  public onKeyUp(key: KeyCode) {
    this.wasmEngine.onKeyUp(key);
  }
}

let engine: Engine;

const enum EngineCommands {
  INIT = 'main_engine_worker_init',
  RUN = 'main_engine_worker_run',
  KEYDOWN = 'main_engine_worker_keydown',
  KEYUP = 'main_engine_worker_keyup',
}

const commands = {
  [EngineCommands.INIT]: async (params: EngineParams) => {
    engine = new Engine();
    await engine.init(params);
    postMessage({ status: 'init completed' });
  },
  [EngineCommands.RUN]: () => {
    engine.run();
  },
  [EngineCommands.KEYDOWN]: (key: KeyCode) => {
    engine.onKeyDown(key);
  },
  [EngineCommands.KEYUP]: (key: KeyCode) => {
    engine.onKeyUp(key);
  },
};

self.onmessage = ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {
      console.error(err);
    }
  }
};

export { EngineParams, EngineCommands };
