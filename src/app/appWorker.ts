import type { StatsValues } from '../ui/stats/stats';
import type {
  KeyInputEvent,
  MouseMoveEvent,
  CanvasDisplayResizeEvent,
} from './events';
import type { AuxAppWorkerParams, AuxAppWorkerDesc } from './auxAppWorker';
import type { WasmEngineParams } from '../engine/wasmEngine/wasmEngine';
import type { WasmViews } from '../engine/wasmEngine/wasmViews';
import type { WasmEngineModule } from '../engine/wasmEngine/wasmLoader';
import { mainConfig } from '../config/mainConfig';
import { MILLI_IN_SEC } from '../common';
import { StatsEnum } from '../ui/stats/stats';
import { AppCommandEnum } from './appTypes';
import {
  InputManager,
  MouseCodeEnum,
  EnginePanelInputKeyCodeEnum,
} from '../input/inputManager';
import { InputAction, InputActionBehavior } from '../input/inputAction';
import { AuxAppWorkerCommandEnum } from './auxAppWorker';
import { WasmEngine } from '../engine/wasmEngine/wasmEngine';
import { type WasmRun } from '../engine/wasmEngine/wasmRun';
import { arrAvg } from '../engine/utils';
import {
  TriangleVertexColorRenderer,
  type WebGPUInitInput,
} from '../engine/render/triangleVertexColorRenderer';

interface AppWorkerParams {
  engineCanvas: OffscreenCanvas;
}

class AppWorker {
  private static readonly UPDATE_PERIOD_MS =
    (mainConfig.multiplier * MILLI_IN_SEC) / mainConfig.targetUPS;

  private static readonly UPDATE_TIME_MAX = AppWorker.UPDATE_PERIOD_MS * 8;

  private static readonly STATS_ARR_LEN = 10; // fps, ups
  private static readonly FRAME_TIMES_ARR_LEN = 10; // used for ufps
  private static readonly TIMES_SINCE_LAST_FRAME_ARR_LEN = 5; // update, render

  private static readonly STATS_PERIOD_MS = 100; // MILLI_IN_SEC;

  private params: AppWorkerParams;
  private inputManager: InputManager;

  private numWorkers: number; // 1 main + N aux
  private auxWorkers: AuxAppWorkerDesc[]; // N aux

  private wasmEngine: WasmEngine;
  private wasmRun: WasmRun;
  private wasmEngineModule: WasmEngineModule;
  private wasmViews: WasmViews;

  private pressA: InputAction;
  private pressB: InputAction;

  private mouseMoveLeft: InputAction;
  private mouseMoveRight: InputAction;
  private mouseMoveUp: InputAction;
  private mouseMoveDown: InputAction;

  private triangleVertexColorRend: TriangleVertexColorRenderer;

  public async init(params: AppWorkerParams): Promise<void> {
    this.params = params;
    await this.initGfx();
    await this.initWasmEngine();
    await this.initAuxWorkers();
    this.initInput();
  }

  private async initGfx(): Promise<void> {
    // const { engineCanvas } = this.params;
    const renderInitInput: WebGPUInitInput = {
      canvas: this.params.engineCanvas,
      background: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
      // format: 'bgra8unorm',
      // msaaCount: 1,
    };
    this.triangleVertexColorRend = new TriangleVertexColorRenderer();
    await this.triangleVertexColorRend.init(renderInitInput);
  }

  private get2dCtxFromCanvas(
    canvas: OffscreenCanvas,
  ): OffscreenCanvasRenderingContext2D {
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    }) as OffscreenCanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false; // no blur, keep the pixels sharpness
    return ctx;
  }

  private initInput(): void {
    this.inputManager = new InputManager();
    this.initInputActions();
  }

  private initInputActions(): void {
    this.pressA = new InputAction('A', InputActionBehavior.NORMAL);
    // this.pressA = new InputAction(
    //   'A',
    //   InputActionBehavior.DETECT_INITAL_PRESS_ONLY,
    // );
    this.inputManager.mapToKey(EnginePanelInputKeyCodeEnum.KEY_A, this.pressA);

    this.pressB = new InputAction('B', InputActionBehavior.NORMAL);
    // this.pressB = new InputAction(
    //   'B',
    //   InputActionBehavior.DETECT_INITAL_PRESS_ONLY,
    // );
    this.inputManager.mapToKey(EnginePanelInputKeyCodeEnum.KEY_B, this.pressB);

    this.mouseMoveLeft = new InputAction(
      'MouseLeft',
      InputActionBehavior.NORMAL,
    );
    this.mouseMoveRight = new InputAction(
      'MouseRight',
      InputActionBehavior.NORMAL,
    );
    this.mouseMoveUp = new InputAction('MouseUp', InputActionBehavior.NORMAL);
    this.mouseMoveDown = new InputAction(
      'MouseDown',
      InputActionBehavior.NORMAL,
    );

    this.inputManager.mapToMouse(MouseCodeEnum.MOVE_LEFT, this.mouseMoveLeft);
    this.inputManager.mapToMouse(MouseCodeEnum.MOVE_RIGHT, this.mouseMoveRight);
    this.inputManager.mapToMouse(MouseCodeEnum.MOVE_UP, this.mouseMoveUp);
    this.inputManager.mapToMouse(MouseCodeEnum.MOVE_DOWN, this.mouseMoveDown);
  }

  private async initAuxWorkers(): Promise<void> {
    try {
      const numAuxAppWorkers = mainConfig.numAuxWorkers;
      this.numWorkers = 1 + numAuxAppWorkers;
      console.log(`num total workers: ${this.numWorkers}`);
      const genWorkerIdx = (() => {
        let nextWorkerIdx = 1;
        return (): number => nextWorkerIdx++;
      })();
      this.auxWorkers = Array.from({ length: numAuxAppWorkers });
      let remWorkers = numAuxAppWorkers;
      const initStart = Date.now();
      await new Promise<void>((resolve, reject) => {
        if (numAuxAppWorkers === 0) {
          resolve();
          return;
        }
        const workerUrl = new URL('auxAppWorker.ts', import.meta.url);
        for (let i = 0; i < numAuxAppWorkers; ++i) {
          const workerIdx = genWorkerIdx();
          const engineWorker = {
            workerIdx,
            worker: new Worker(workerUrl, {
              name: `aux-app-worker-${workerIdx}`,
              type: 'module',
            }),
          };
          this.auxWorkers[i] = engineWorker;
          const workerParams: AuxAppWorkerParams = {
            workerIdx,
            numWorkers: numAuxAppWorkers,
            wasmRunParams: {
              ...this.wasmEngine.WasmRunParams,
              workerIdx,
            },
          };
          engineWorker.worker.postMessage({
            command: AuxAppWorkerCommandEnum.INIT,
            params: workerParams,
          });
          // engineWorker.worker.onmessage = ({ data }): void => {
          engineWorker.worker.addEventListener('message', ({ data }): void => {
            --remWorkers;
            console.log(
              `Aux app worker id=${workerIdx} initd,
               left count=${remWorkers}, time=${
                 Date.now() - initStart
               }ms with data = ${JSON.stringify(data)}`,
            );
            if (remWorkers === 0) {
              console.log(
                `Aux app workers init done. After ${Date.now() - initStart}ms`,
              );
              resolve();
            }
          });
          engineWorker.worker.addEventListener('error', (error) => {
            console.log(
              `Aux app worker id=${workerIdx} error: ${error.message}\n`,
            );
            reject(error);
          });
        }
      });
    } catch (error) {
      console.error(
        `Error during aux app workers init: ${JSON.stringify(error)}`,
      );
    }
  }

  private async initWasmEngine(): Promise<void> {
    this.wasmEngine = new WasmEngine();
    const wasmEngineParams: WasmEngineParams = {
      numWorkers: mainConfig.numAuxWorkers,
    };
    await this.wasmEngine.init(wasmEngineParams);
    this.wasmRun = this.wasmEngine.WasmRun;
    this.wasmEngineModule = this.wasmRun.WasmModules.engine;
    this.wasmViews = this.wasmRun.WasmViews;
  }

  private runAuxWorkers(): void {
    for (const { worker } of this.auxWorkers) {
      worker.postMessage({
        command: AuxAppWorkerCommandEnum.RUN,
      });
    }
  }

  private checkInput(): void {
    // if (this.pressA.isPressed()) {
    // console.log('A pressed');
    // postMessage({
    //   command: AppCommandEnum.EVENT,
    //   params: {
    //     event: 'A pressed',
    //     msg: 'ahooo',
    //   } as EventLog,
    // });
    // }
    // if (this.pressB.isPressed()) {
    // console.log('B pressed');
    // postMessage({
    //   command: AppCommandEnum.EVENT,
    //   params: {
    //     event: 'B pressed',
    //     msg: 'bahooo',
    //   } as EventLog,
    // });
    // }
    // if (this.mouseMoveLeft.isPressed()) {
    //   console.log('Mouse move left');
    // }
    // if (this.mouseMoveRight.isPressed()) {
    //   console.log('Mouse move right');
    // }
    // if (this.mouseMoveUp.isPressed()) {
    //   console.log('Mouse move up');
    // }
    // if (this.mouseMoveDown.isPressed()) {
    //   console.log('Mouse move down');
    // }
  }

  public run(): void {
    let lastFrameStartTime: number;
    // let last_render_t: number;
    let updTimeAcc: number;
    // let renderTimeAcc: number;
    let elapsedTimeMs: number;
    // let renderThen: number;
    let timeSinceLastFrameMs: number;
    let avgTimeSinceLastFrame: number;
    let frameStartTimeMs: number;

    let timeLastFrameCnt: number;
    let frameCnt: number;
    let frameTimeCnt: number;
    // eslint-disable-next-line unused-imports/no-unused-vars
    let renderCnt: number;
    let updateCnt: number;
    let statsCnt: number;

    let lastStatsTime: number;
    let statsTimeAcc: number;

    let frameTimeMsArr: Float64Array;
    let timeMsSinceLastFrameArr: Float64Array;
    let fpsArr: Float32Array;
    let upsArr: Float32Array;

    let resync: boolean;
    // let isRunning: boolean;
    // let isPaused: boolean;

    const mainLoopInit = (): void => {
      lastFrameStartTime = lastStatsTime /* = renderThen */ = performance.now();
      frameTimeMsArr = new Float64Array(AppWorker.FRAME_TIMES_ARR_LEN);
      updTimeAcc = 0;
      // renderTimeAcc = 0;
      elapsedTimeMs = 0;
      timeMsSinceLastFrameArr = new Float64Array(
        AppWorker.TIMES_SINCE_LAST_FRAME_ARR_LEN,
      );
      frameCnt = 0;
      frameTimeCnt = 0;
      timeLastFrameCnt = 0;
      statsTimeAcc = 0;
      fpsArr = new Float32Array(AppWorker.STATS_ARR_LEN);
      upsArr = new Float32Array(AppWorker.STATS_ARR_LEN);
      statsCnt = 0;
      resync = false;
      updateCnt = 0;
      renderCnt = 0;
      // isRunning = true;
      // isPaused = false;
      requestAnimationFrame(frame);
    };

    const begin = (): void => {
      frameStartTimeMs = performance.now();
      timeSinceLastFrameMs = frameStartTimeMs - lastFrameStartTime;
      lastFrameStartTime = frameStartTimeMs;
      timeSinceLastFrameMs = Math.min(
        timeSinceLastFrameMs,
        AppWorker.UPDATE_TIME_MAX,
      );
      timeSinceLastFrameMs = Math.max(timeSinceLastFrameMs, 0);
      timeMsSinceLastFrameArr[
        timeLastFrameCnt++ % timeMsSinceLastFrameArr.length
      ] = timeSinceLastFrameMs;
      // avgTimeSinceLastFrame = timeSinceLastFrame;
      // console.log(`avgTimeSinceLastFrame = ${avgTimeSinceLastFrame}`);
      avgTimeSinceLastFrame = arrAvg(timeMsSinceLastFrameArr, timeLastFrameCnt);
    };

    const frame = (): void => {
      requestAnimationFrame(frame);
      begin();
      update();
      render();
      stats();
    };

    const update = (): void => {
      // if (is_paused) return; // TODO
      updTimeAcc += avgTimeSinceLastFrame;
      // handle timer anomalies
      // spiral of death protection
      if (updTimeAcc > AppWorker.UPDATE_TIME_MAX) {
        resync = true;
      }
      // timer resync if requested
      if (resync) {
        updTimeAcc = 0; // TODO
        // delta_time = App.UPD_PERIOD;
      }

      this.checkInput();

      while (updTimeAcc >= AppWorker.UPDATE_PERIOD_MS) {
        // TODO: see multiplier in update_period def
        // update state with UPDATE_PERIOD_MS
        // updateState(STEP, t / MULTIPLIER);
        updTimeAcc -= AppWorker.UPDATE_PERIOD_MS;
        updateCnt++;
      }
    };

    const render = (): void => {
      this.syncWorkers();
      // this.clearBg();
      this.waitWorkers();
      this.drawFrame();
      saveFrameTime();
      renderCnt++;
    };

    const saveFrameTime = (): void => {
      const frameTimeMs = performance.now() - frameStartTimeMs;
      frameTimeMsArr[frameTimeCnt++ % frameTimeMsArr.length] = frameTimeMs;
    };

    const stats = (): void => {
      ++frameCnt;
      statsTimeAcc += timeSinceLastFrameMs;
      if (statsTimeAcc >= AppWorker.STATS_PERIOD_MS) {
        statsTimeAcc %= AppWorker.STATS_PERIOD_MS;
        // const tspent = (tnow - start_time) / App.MILLI_IN_SEC;
        const now = performance.now();
        const elapsed = now - lastStatsTime;
        lastStatsTime = now;
        elapsedTimeMs += elapsed;
        const oneOverElapsed = MILLI_IN_SEC / elapsedTimeMs;
        const fps = frameCnt * oneOverElapsed;
        const ups = updateCnt * oneOverElapsed;
        const statIdx = statsCnt++ % fpsArr.length;
        fpsArr[statIdx] = fps;
        upsArr[statIdx] = ups;
        const avgFps = arrAvg(fpsArr, statsCnt);
        const avgUps = arrAvg(upsArr, statsCnt);
        const avgFrameTimeMs = arrAvg(frameTimeMsArr, frameTimeCnt);
        const avgUfps = MILLI_IN_SEC / avgFrameTimeMs;
        // console.log(`avgUfps = ${avgUfps}, avgFrameTime = ${avgFrameTime}`);
        const statsValues: StatsValues = {
          [StatsEnum.FPS]: avgFps,
          [StatsEnum.UPS]: avgUps,
          [StatsEnum.UFPS]: avgUfps,
          [StatsEnum.FRAME_TIME_MS]: avgFrameTimeMs,
        };
        postMessage({
          command: AppCommandEnum.UPDATE_STATS,
          params: statsValues,
        });
      }
    };

    this.runAuxWorkers();
    requestAnimationFrame(mainLoopInit);

    // TODO: test events
    // setInterval(() => {
    //   // console.log('sending...');
    //   postMessage({
    //     command: AppCommandEnum.EVENT,
    //     params: Math.floor(Math.random() * 100),
    //   });
    // }, 2000);
  }

  private syncWorkers(): void {
    for (const { workerIdx } of this.auxWorkers) {
      Atomics.store(this.wasmViews.syncArr, workerIdx, 1);
      Atomics.notify(this.wasmViews.syncArr, workerIdx);
    }
  }

  private waitWorkers(): void {
    for (const { workerIdx } of this.auxWorkers) {
      Atomics.wait(this.wasmViews.syncArr, workerIdx, 1);
    }
  }

  // private clearBg() {
  //   this.frameBuf32.fill(0xff_00_00_00);
  //   // for (let i = 0; i < this.frameBuf32.length; ++i) {
  //   //   this.frameBuf32[i] = 0xff_00_00_00;
  //   // }
  // }

  public drawFrame(): void {
    this.triangleVertexColorRend.render();
  }

  public onKeyDown(event: KeyInputEvent): void {
    this.inputManager.onKeyDown(event);
  }

  public onKeyUp(event: KeyInputEvent): void {
    this.inputManager.onKeyUp(event);
  }

  public onMouseMove(inputEvent: MouseMoveEvent): void {
    this.inputManager.onMouseMove(inputEvent);
  }

  public onCanvasDisplayResize(
    displayWidth: number,
    displayHeight: number,
  ): void {
    console.log('onCanvasDisplayResize', displayWidth, displayHeight);
  }
}

let appWorker: AppWorker;

const enum AppWorkerCommandEnum {
  INIT = 'app_worker_init',
  RUN = 'app_worker_run',
  KEY_DOWN = 'app_worker_key_down',
  KEY_UP = 'app_worker_key_up',
  MOUSE_MOVE = 'app_worker_mouse_move',
  RESIZE_CANVAS_DISPLAY_SIZE = 'app_worker_resize_canvas_display_size',
}

const commands = {
  [AppWorkerCommandEnum.INIT]: async (
    params: AppWorkerParams,
  ): Promise<void> => {
    appWorker = new AppWorker();
    await appWorker.init(params);
    postMessage({
      command: AppCommandEnum.INIT,
    });
  },
  [AppWorkerCommandEnum.RUN]: (): void => {
    appWorker.run();
  },
  [AppWorkerCommandEnum.KEY_DOWN]: (inputEvent: KeyInputEvent): void => {
    appWorker.onKeyDown(inputEvent);
  },
  [AppWorkerCommandEnum.KEY_UP]: (inputEvent: KeyInputEvent): void => {
    appWorker.onKeyUp(inputEvent);
  },
  [AppWorkerCommandEnum.MOUSE_MOVE]: (inputEvent: MouseMoveEvent): void => {
    appWorker.onMouseMove(inputEvent);
  },
  [AppWorkerCommandEnum.RESIZE_CANVAS_DISPLAY_SIZE]: (
    resizeEvent: CanvasDisplayResizeEvent,
  ): void => {
    const { width, height } = resizeEvent;
    appWorker.onCanvasDisplayResize(width, height);
  },
};

// eslint-disable-next-line sonarjs/post-message
globalThis.addEventListener('message', (event): void => {
  const {
    data: { command, params },
  } = event;
  const commandKey = command as keyof typeof commands;
  if (Object.prototype.hasOwnProperty.call(commands, commandKey)) {
    try {
      commands[commandKey](params);
    } catch (error) {
      console.error('error executing command in app worker message handler');
      console.error(error);
    }
  }
});

export type { AppWorkerParams };
export { AppWorkerCommandEnum };
