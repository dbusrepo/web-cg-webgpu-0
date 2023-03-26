import assert from 'assert';
import * as WasmUtils from './wasmMemUtils';
import {
  // BPP_PAL,
  // BPP_RGBA,
  StatsNames,
  StatsValues,
  MILLI_IN_SEC,
} from '../common';

import { mainConfig } from '../config/mainConfig';
import * as utils from './utils';

import Commands from './engineCommands';
import PanelCommands from '../panels/enginePanelCommands';
import { KeyCode } from './input/inputManager';

import { EngineImpl, EngineImplConfig } from './engineImpl';

type EngineConfig = {
  canvas: OffscreenCanvas;
  sendStats: boolean;
  // usePalette: boolean; // TODO move to def config?
};

class Engine {
  private static readonly RENDER_PERIOD = MILLI_IN_SEC / mainConfig.targetFPS;

  private static readonly UPDATE_PERIOD =
    (mainConfig.multiplier * MILLI_IN_SEC) / mainConfig.targetUPS;

  private static readonly STATS_PERIOD = MILLI_IN_SEC;

  private static readonly UPDATE_TIME_MAX = Engine.UPDATE_PERIOD * 8;

  private static readonly STATS_ARR_LENGTH = 8;
  private static readonly TIME_LAST_FRAME_ARR_LENGTH = 4;
  private static readonly FRAME_TIMES_ARR_LENGTH = 10;

  private _cfg: EngineConfig;
  private _engineImpl: EngineImpl;
  private _startTime: number;

  public async init(config: EngineConfig): Promise<void> {
    this._startTime = Date.now();
    this._cfg = config;
    this._engineImpl = new EngineImpl();
    const engImplCfg: EngineImplConfig = {
      canvas: this._cfg.canvas,
    };
    await this._engineImpl.init(engImplCfg);
  }

  public onKeyDown(key: KeyCode) {
    this._engineImpl.onKeyDown(key);
  }

  public onKeyUp(key: KeyCode) {
    this._engineImpl.onKeyUp(key);
  }

  // private _getBPP(): number {
  //   return this._cfg.usePalette ? BPP_PAL : BPP_RGBA;
  // }

  public run(): void {
    let lastFrameStartTime: number;
    // let last_render_t: number;
    let updTimeAcc: number;
    let elapsedTime: number;
    let frameThen: number;
    let timeSinceLastFrame: number;
    let frameStartTime: number;

    let frameCounter: number;
    let renderCounter: number;
    let updateCounter: number;
    let statsCounter: number;

    let lastStatsTime: number;
    let statsTimeAcc: number;

    let renderFrameTimeArr: Float64Array;
    let timeSinceLastFrameArr: Float64Array;
    let fpsArr: Float32Array;
    let upsArr: Float32Array;

    let resync: boolean;
    let isRunning: boolean;
    let isPaused: boolean;

    const getTimeMs = () => performance.now();

    const mainLoopInit = () => {
      lastFrameStartTime = lastStatsTime = getTimeMs();
      renderFrameTimeArr = new Float64Array(Engine.FRAME_TIMES_ARR_LENGTH);
      updTimeAcc = 0;
      elapsedTime = 0;
      timeSinceLastFrameArr = new Float64Array(
        Engine.TIME_LAST_FRAME_ARR_LENGTH,
      );
      frameCounter = 0;
      statsTimeAcc = 0;
      fpsArr = new Float32Array(Engine.STATS_ARR_LENGTH);
      upsArr = new Float32Array(Engine.STATS_ARR_LENGTH);
      statsCounter = 0;
      resync = false;
      renderCounter = updateCounter = 0;
      frameThen = performance.now();
      isRunning = true;
      isPaused = false;
      // runWorkers();
      requestAnimationFrame(mainLoop);
    };

    const updateFrameTime = () => {
      lastFrameStartTime = frameStartTime;
      // if (is_paused) return; // TODO
      // handle timer anomalies
      timeSinceLastFrame = Math.min(timeSinceLastFrame, Engine.UPDATE_TIME_MAX);
      timeSinceLastFrame = Math.max(timeSinceLastFrame, 0);
      timeSinceLastFrameArr[frameCounter++ % timeSinceLastFrameArr.length] =
        timeSinceLastFrame;
      timeSinceLastFrame = utils.calcAvgArrValue(
        timeSinceLastFrameArr,
        frameCounter,
      );
      updTimeAcc += timeSinceLastFrame;
      // spiral of death protection
      if (updTimeAcc > Engine.UPDATE_TIME_MAX) {
        resync = true;
      }
      // timer resync if requested
      if (resync) {
        updTimeAcc = 0; // TODO
        // delta_time = App.UPD_PERIOD;
      }
    };

    const mainLoop = () => {
      requestAnimationFrame(mainLoop);
      frameStartTime = getTimeMs();
      timeSinceLastFrame = frameStartTime - lastFrameStartTime;
      updateStats();
      update();
      render();
    };

    const update = () => {
      updateFrameTime();
      while (updTimeAcc >= Engine.UPDATE_PERIOD) {
        // TODO see multiplier in update_period def
        // update state with UPD_PERIOD
        // this.scene.update(STEP, t / MULTIPLIER);
        // gameUpdate(STEP, t / MULTIPLIER);
        updTimeAcc -= Engine.UPDATE_PERIOD;
        updateCounter++;
      }
    };

    const render = () => {
      const frameNow = performance.now();
      const elapsed = frameNow - frameThen;
      if (elapsed >= Engine.RENDER_PERIOD) {
        frameThen = frameNow - (elapsed % Engine.RENDER_PERIOD);
        this._engineImpl.drawFrame();
        renderFrameTimeArr[renderCounter++ % renderFrameTimeArr.length] =
          performance.now() - frameStartTime;
      }
    };

    const updateStats = () => {
      statsTimeAcc += timeSinceLastFrame;
      if (statsTimeAcc >= Engine.STATS_PERIOD) {
        statsTimeAcc = 0;
        // const tspent = (tnow - start_time) / App.MILLI_IN_SEC;
        const elapsed = frameStartTime - lastStatsTime;
        lastStatsTime = frameStartTime;
        elapsedTime += elapsed;
        const fps = (renderCounter * MILLI_IN_SEC) / elapsedTime;
        const ups = (updateCounter * MILLI_IN_SEC) / elapsedTime;
        // console.log(`${fps} - ${ups}`);
        const statsIdx = statsCounter++ % fpsArr.length;
        fpsArr[statsIdx] = fps;
        upsArr[statsIdx] = ups;
        if (this._cfg.sendStats) {
          const avgFps = Math.round(
            utils.calcAvgArrValue(fpsArr, statsCounter),
          );
          const avgUps = Math.round(
            utils.calcAvgArrValue(upsArr, statsCounter),
          );
          const avgUnlockedFps = Math.round(
            MILLI_IN_SEC /
              utils.calcAvgArrValue(renderFrameTimeArr, renderCounter),
          );
          // const workersHeapMem = this._wasmMemViews.workersMemCounters.reduce(
          //   (tot, cnt) => tot + cnt,
          //   0,
          // );
          const stats: Partial<StatsValues> = {
            [StatsNames.FPS]: avgFps,
            [StatsNames.UPS]: avgUps,
            [StatsNames.UFPS]: avgUnlockedFps,
            // [StatsNames.WASM_HEAP]: workersHeapMem,
          };
          // console.log(avgUnlockedFps);
          // console.log(renderFrameTimeArr);
          postMessage({
            command: PanelCommands.UPDATESTATS,
            params: stats,
          });
        }
      }
    };

    // setInterval(() => {
    //   // console.log('sending...');
    //   postMessage({
    //     command: PanelCommands.EVENT,
    //     params: Math.floor(Math.random() * 100),
    //   });
    // }, 2000);

    requestAnimationFrame(mainLoopInit);
  }
}

let engine: Engine;

const commands = {
  [Commands.RUN]: async (config: EngineConfig): Promise<void> => {
    engine = new Engine();
    await engine.init(config);
    engine.run();
  },
  [Commands.KEYDOWN]: (key: KeyCode) => {
    engine.onKeyDown(key);
  },
  [Commands.KEYUP]: (key: KeyCode) => {
    engine.onKeyUp(key);
  },
};

self.onmessage = ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
};

export { EngineConfig, Engine };
