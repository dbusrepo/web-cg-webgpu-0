import assert from 'assert';
import * as WasmUtils from './wasmMemUtils';
import {
  BPP_PAL,
  BPP_RGBA,
  PAL_ENTRY_SIZE,
  PALETTE_SIZE,
  StatsNames,
  StatsValues,
  PAGE_SIZE_BYTES,
  MILLI_IN_SEC,
} from '../common';

// import loader from '@assemblyscript/loader';
// import assert from 'assert';
import { mainConfig } from '../config/mainConfig';
import * as utils from './utils';

import Commands from './engineCommands';
import PanelCommands from '../panels/enginePanelCommands';

import { InputManager, KeyCode } from './input/inputManager';

// // import * as loadUtils from '../utils/loadFiles'; // TODO
// import {
//   WorkerConfig,
//   WorkerWasmMemConfig,
//   WorkerInitData,
//   WasmMemViews,
// } from './wasmEngine';

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
  private _inputManager: InputManager;
  private _engineImpl: EngineImpl;
  private _startTime: number;

  public async init(config: EngineConfig): Promise<void> {
    this._startTime = Date.now();
    this._cfg = config;
    this._initInputManager();
    this._engineImpl = new EngineImpl();
    const engImplCfg: EngineImplConfig = {
      canvas: this._cfg.canvas,
    };
    await this._engineImpl.init(engImplCfg);
    // this._init
    // await this._initWorkers();
    // console.log(this._workersInitData);
    // await this._initWasmMem();
  }

  private _initInputManager() {
    this._inputManager = new InputManager();
    this._inputManager.init();
    const onkey = (key: KeyCode, down: boolean) => {
      // console.log('key ', key, ' state: ', down);
      // map key to index
      const idx = 0;
      // TODO FIX eng impl -> wasm eng
      // this._wasmMemViews.inputKeys[idx] = down ? 1 : 0;
    };
    this._inputManager.addKeyDownHandler(
      'KeyA',
      onkey.bind(null, 'KeyA', true),
    );
    this._inputManager.addKeyUpHandler('KeyA', onkey.bind(null, 'KeyA', false));
  }

  public onKeyDown(key: KeyCode) {
    this._inputManager.onKeyDown(key);
  }

  public onKeyUp(key: KeyCode) {
    this._inputManager.onKeyUp(key);
  }

  // private _getBPP(): number {
  //   return this._cfg.usePalette ? BPP_PAL : BPP_RGBA;
  // }

  // private _buildWorkerConfig(workerIdx: number): WorkerConfig {
  //   return {
  //     workerIdx,
  //     numWorkers: Engine.NUM_AUX_WORKERS, // + 1?
  //     frameWidth: this._config.canvas.width,
  //     frameHeight: this._config.canvas.height,
  //     imageUrls: this._images2LoadWorker(workerIdx),
  //     usePalette: this._config.usePalette,
  //   };
  // }

  // private _initWorkerWasmMemConfig() {
  //   this._workerWasmMemConfig = {
  //     wasmMem: this._wasmMem,
  //     wasmWorkerHeapSize: mainConfig.wasmWorkerHeapPages * PAGE_SIZE_BYTES,
  //     wasmMemRegionsSizes: this._wasmMemRegionsSizes,
  //     wasmMemRegionsOffsets: this._wasmMemRegionsOffsets,
  //     wasmImagesIndexOffset:
  //       this._wasmMemRegionsOffsets[WasmUtils.MemRegions.IMAGES],
  //     wasmImagesIndexSize: WasmUtils.initImages.getImagesIndexSize(),
  //     wasmWorkerImagesOffsets: this._workersInitData.workerImagesOffsets,
  //     wasmImagesSizes: this._workersInitData.imagesSizes,
  //     wasmWorkerImagesSize: this._workersInitData.workerImagesSizes,
  //     wasmImagesOffsets: this._workersInitData.imagesOffsets,
  //   };
  // }

  // private async _initWasmMemoryWorkers(): Promise<void> {
  //   let workerCount = Engine.NUM_AUX_WORKERS;
  //   const initStart = Date.now();
  //   console.log('Initializing wasm memory with workers...');
  //   // this._addImageIndex2WorkersOffsets();
  //   return new Promise((resolve, reject) => {
  //     for (let workerIdx = 0; workerIdx < Engine.NUM_AUX_WORKERS; ++workerIdx) {
  //       const worker = this._workers[workerIdx];
  //       worker.onmessage = () => {
  //         --workerCount;
  //         console.log(
  //           `Worker id=${workerIdx} wasm mem ready, count=${workerCount}, 
  //            time=${Date.now() - initStart}ms`,
  //         );
  //         if (!workerCount) {
  //           console.log(
  //             `All workers ready. Wasm memory initiliazed. After ${
  //               Date.now() - this._startTime
  //             }ms`,
  //           );
  //           resolve();
  //         }
  //       };
  //       worker.onerror = (error) => {
  //         console.log(`Worker id=${workerIdx} error: ${error.message}\n`);
  //         reject(error);
  //       };
  //       worker.postMessage({
  //         command: WorkerCommands.INIT_WASM,
  //         params: this._workerWasmMemConfig,
  //       });
  //     }
  //   });
  // }

  // private async _initWorkers() {
  //   assert(Engine.NUM_AUX_WORKERS >= 0);
  //
  //   this._workers = [];
  //   this._workersInitData = {
  //     numImages: 0, // updated later
  //     totalImagesSize: 0,
  //     workerImagesOffsets: new Array(Engine.NUM_AUX_WORKERS).fill(0),
  //     workerImagesSizes: new Array(Engine.NUM_AUX_WORKERS),
  //     imagesSizes: [],
  //     imagesOffsets: [],
  //   };
  //
  //   // offset used to fill the sizes array (with [w,h]) in worker order in updateWorkersData
  //   const workerSizesOffsets: number[] = new Array(Engine.NUM_AUX_WORKERS).fill(0);
  //
  //   const updateWorkersNumImagesOffset = (
  //     workerIdx: number,
  //     workerConfig: WorkerConfig,
  //   ) => {
  //     for (
  //       let nextWorker = workerIdx + 1;
  //       nextWorker < Engine.NUM_AUX_WORKERS;
  //       nextWorker++
  //     ) {
  //       workerSizesOffsets[nextWorker] += workerConfig.imageUrls.length;
  //     }
  //   };
  //
  //   const updateWorkersData = (
  //     workerIdx: number,
  //     workerData: WorkerInitData,
  //   ) => {
  //     this._workersInitData.workerImagesSizes[workerIdx] =
  //       workerData.totalImagesSize;
  //     this._workersInitData.totalImagesSize += workerData.totalImagesSize;
  //     // update wasm mem image offsets for workers that follow workerIdx
  //     for (
  //       let nextWorker = workerIdx + 1;
  //       nextWorker < Engine.NUM_AUX_WORKERS;
  //       nextWorker++
  //     ) {
  //       this._workersInitData.workerImagesOffsets[nextWorker] +=
  //         workerData.totalImagesSize;
  //     }
  //     // insert the sizes for images from worker idx
  //     for (
  //       let i = 0, j = workerSizesOffsets[workerIdx];
  //       i < workerData.imagesSizes.length;
  //       ++i, ++j
  //     ) {
  //       this._workersInitData.imagesSizes[j] = workerData.imagesSizes[i];
  //     }
  //     this._workersInitData.numImages += workerData.imagesSizes.length;
  //     // this._workersInitData.imagesSizes.splice(
  //     //   workerSizesOffset[workerIdx],
  //     //   0,
  //     //   ...workerData.imagesSizes,
  //     // );
  //     // console.log(
  //     //   'worker ' + workerIdx + ' inserting ',
  //     //   workerData.imagesSizes,
  //     //   ' at pos ' + workerSizesOffset[workerIdx],
  //     // );
  //   };
  //
  //   const workerPostInit = () => {
  //     // check all images buffers loaded
  //     assert(this._workersInitData.numImages === this._imagesPaths.length);
  //     // calc images offsets
  //     const calcImagesOffsets = () => {
  //       const numImages = this._workersInitData.imagesSizes.length;
  //       const imagesOffsets = new Array<number>(numImages);
  //       let prevSize: number;
  //       imagesOffsets[0] = 0; // start from images data and not from index
  //       // (images region start) //WasmUtils.initImages.getImageIndexSize(numImages);
  //       this._workersInitData.imagesSizes.forEach(([w, h], idx) => {
  //         const imageSize = w * h * this._getBPP();
  //         if (idx > 0) {
  //           imagesOffsets[idx] = imagesOffsets[idx - 1] + prevSize;
  //         }
  //         prevSize = imageSize;
  //       });
  //       this._workersInitData.imagesOffsets = imagesOffsets;
  //     };
  //
  //     calcImagesOffsets();
  //   };
  //
  //   let auxWorkerCnt = Engine.NUM_AUX_WORKERS;
  //   console.log('Initializing auxiliary workers...');
  //   const tStart = Date.now();
  //
  //   return new Promise<void>((resolve, reject) => {
  //     for (let workerIdx = 0; workerIdx < Engine.NUM_AUX_WORKERS; ++workerIdx) {
  //       const worker = new Worker(new URL('./wasmEngine.ts', import.meta.url), {
  //         name: `worker-${workerIdx}`,
  //         type: 'module',
  //       });
  //       this._workers.push(worker);
  //       worker.onmessage = ({ data: initData }) => {
  //         updateWorkersData(workerIdx, initData);
  //         --auxWorkerCnt;
  //         console.log(
  //           `Worker id=${workerIdx} init, count=${auxWorkerCnt}, time=${
  //             Date.now() - tStart
  //           }ms with data = ${JSON.stringify(initData)}`,
  //         );
  //         if (auxWorkerCnt === 0) {
  //           console.log(
  //             `Workers init done. After ${Date.now() - this._startTime}ms`,
  //           );
  //           workerPostInit();
  //           resolve();
  //         }
  //       };
  //
  //       worker.onerror = (error) => {
  //         console.log(`Worker id=${workerIdx} error: ${error.message}\n`);
  //         reject(error);
  //       };
  //       const workerConfig = this._buildWorkerConfig(workerIdx);
  //       updateWorkersNumImagesOffset(workerIdx, workerConfig);
  //       worker.postMessage({
  //         command: WorkerCommands.INIT,
  //         params: workerConfig,
  //       });
  //     }
  //   });
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

    // const runWorkers = (): void => {
    //   this._workers.forEach((worker) => {
    //     worker.postMessage({
    //       command: 'run',
    //     });
    //   });
    // };

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
        this.drawFrame();
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

  private drawFrame(): void {
    // for (let i = 0; i < Engine.NUM_AUX_WORKERS; ++i) {
    //   utils.syncStore(this._wasmMemViews.syncArr, i, 1);
    //   utils.syncNotify(this._wasmMemViews.syncArr, i);
    // }
    // for (let i = 0; i < Engine.NUM_AUX_WORKERS; ++i) {
    //   utils.syncWait(this._wasmMemViews.syncArr, i, 1);
    // }
    this._engineImpl.drawFrame();
    // utils.sleep(this._wasmMemViews.sleepArr, Engine.MAIN_WORKER_IDX, 16);
    // this._imageData.data.set(this._wasmMemViews.frameBufferRGBA);
  }

  // private showStats(): void {
  //   this.draw_text(
  //     `FPS: ${Math.round(this.avg_fps)}\nUPS: ${Math.round(this.avg_ups)}`,
  //   );
  // }
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
