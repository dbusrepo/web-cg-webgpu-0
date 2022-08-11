import assert from 'assert';
import {
  MemoryRegion,
  MemoryRegionsData,
  MemRegionConfig,
  memRegionSizes,
  memRegionOffsets,
} from './memoryRegions';
// import loader from '@assemblyscript/loader';
// import assert from 'assert';
import { defaultConfig } from '../config/config';
import {
  TypedArray,
  StatsNames,
  StatsValues,
  PAGE_SIZE,
  MILLI_IN_SEC,
} from '../common';
import { syncStore, syncWait, syncNotify, sleep } from './utils';

// import * as loadUtils from '../utils/loadFiles'; // TODO
import { EngineWorkerConfig, EngineWorker } from './engineWorker';

// test img loading... TODO
// import myImgUrl from 'images/samplePNGImage.png';

type EngineConfig = {
  canvas: OffscreenCanvas;
  sendStats: boolean;
};

class Engine {
  private static readonly NUM_ENGINE_WORKERS = 1; // required  >= 1

  // TODO
  private static readonly RENDER_PERIOD =
    MILLI_IN_SEC / defaultConfig.target_fps;
  private static readonly UPDATE_PERIOD =
    (defaultConfig.multiplier * MILLI_IN_SEC) / defaultConfig.target_ups;
  private static readonly UPDATE_TIME_MAX = Engine.UPDATE_PERIOD * 8;

  private static readonly UPD_TIME_ARR_LENGTH = 4;
  private static readonly FRAME_TIME_ARR_LENGTH = 8;

  private static readonly FPS_ARR_LENGTH = 8;
  private static readonly STATS_PERIOD = MILLI_IN_SEC;

  private _engineConfig: EngineConfig;
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _imageData: ImageData;

  protected _frameBuffer: Uint8ClampedArray;
  protected _syncArr: Int32Array;
  protected _sleepArr: Int32Array;

  private _workers: Worker[];

  public async init(config: EngineConfig): Promise<void> {
    assert(Engine.NUM_ENGINE_WORKERS >= 1);

    this._engineConfig = config;

    const { canvas, sendStats } = config;

    const ctx = <OffscreenCanvasRenderingContext2D>(
      canvas.getContext('2d', { alpha: false })
    );
    ctx.imageSmoothingEnabled = false;
    this._ctx = ctx;

    const frameWidth = canvas.width;
    const frameHeight = canvas.height;
    this._imageData = this._ctx.createImageData(frameWidth, frameHeight);

    const memConfig: MemRegionConfig = {
      frameWidth,
      frameHeight,
      numWorkers: Engine.NUM_ENGINE_WORKERS,
    };

    const memSizes = memRegionSizes(memConfig);
    const memOffsets = memRegionOffsets(memConfig, memSizes);
    const memInitialSize = Object.values(memSizes).reduce(
      (acc, size) => acc + size,
      0,
    );

    // TODO
    console.log('mem initial size is: ' + memInitialSize);

    const memory = this.initMemory(memInitialSize);

    this._frameBuffer = new Uint8ClampedArray(
      memory.buffer,
      memOffsets[MemoryRegion.FRAMEBUFFER],
      memSizes[MemoryRegion.FRAMEBUFFER],
    );

    this._syncArr = new Int32Array(
      memory.buffer,
      memOffsets[MemoryRegion.SYNC_ARRAY],
      memSizes[MemoryRegion.SYNC_ARRAY],
    );

    this._sleepArr = new Int32Array(
      memory.buffer,
      memOffsets[MemoryRegion.SLEEP_ARRAY],
      memSizes[MemoryRegion.SLEEP_ARRAY],
    );

    await engine.initEngineWorkers(
      memInitialSize,
      memSizes,
      memOffsets,
      memory,
    );
  }

  private buildWorkerConfig(
    idx: number,
    memInitialSize: number,
    memSizes: MemoryRegionsData,
    memOffsets: MemoryRegionsData,
    memory: WebAssembly.Memory,
  ): EngineWorkerConfig {
    return {
      workerIdx: idx,
      numWorkers: Engine.NUM_ENGINE_WORKERS,
      frameWidth: this._engineConfig.canvas.width,
      frameHeight: this._engineConfig.canvas.height,
      memInitialSize,
      memSizes,
      memOffsets,
      memory,
    };
  }

  private initMemory(memStartSize: number): WebAssembly.Memory {
    const initialPages = defaultConfig.initial_mem_pages;
    console.log(`Initial mem pages: ${initialPages}`);
    console.log(
      `Initial mem pages required: ${Math.ceil(memStartSize / PAGE_SIZE)}`,
    );
    assert(initialPages * PAGE_SIZE >= memStartSize);
    const memory = new WebAssembly.Memory({
      initial: initialPages,
      maximum: 1000, // TODO
      shared: true,
    });
    return memory;
  }

  private async initEngineWorkers(
    memInitialSize: number,
    memSizes: MemoryRegionsData,
    memOffsets: MemoryRegionsData,
    memory: WebAssembly.Memory,
  ): Promise<void> {
    assert(Engine.NUM_ENGINE_WORKERS >= 1);

    this._workers = [];

    let count = Engine.NUM_ENGINE_WORKERS;
    const now = Date.now();

    return new Promise((resolve, reject) => {
      for (
        let workerIdx = 0;
        workerIdx < Engine.NUM_ENGINE_WORKERS;
        ++workerIdx
      ) {
        const worker = new Worker(
          new URL('./engineWorker.ts', import.meta.url),
          {
            name: `worker-${workerIdx}`,
            type: 'module',
          },
        );
        this._workers.push(worker);
        worker.onmessage = ({ data: msg }) => {
          // TODO
          console.log(
            `Worker ready: id=${workerIdx}, count=${--count}, time=${
              Date.now() - now
            }ms`,
          );
          if (count === 0) {
            console.log(`All workers ready. After ${Date.now() - now}ms`);
            resolve();
          }
        };
        worker.onerror = (error) => {
          console.log(`Worker id=${workerIdx} error: ${error.message}\n`);
          reject(error);
        };
        const engineWorkerConfig: EngineWorkerConfig = this.buildWorkerConfig(
          workerIdx,
          memInitialSize,
          memSizes,
          memOffsets,
          memory,
        );
        worker.postMessage({
          command: 'init',
          params: engineWorkerConfig,
        });
      }
    });
  }

  public run(): void {
    let initTime: number; // TODO not used for now...
    let renderTimeArr: Float64Array;
    let lastUpdateTime: number;
    // let last_render_t: number;
    let timeAcc: number;
    let elapsedTime: number;
    let frameThen: number;
    let frameCount: number;
    let updateCount: number;
    let updateTimeArr: Float64Array;
    let updateTimeCount: number;
    let lastStatsTime: number;
    let statsTimeAcc: number;
    let fpsArr: Float32Array;
    let upsArr: Float32Array;
    let fpsCount: number;
    let resync: boolean;
    let isRunning: boolean;
    let isPaused: boolean;

    const runWorkers = (): void => {
      this._workers.forEach((worker) => {
        worker.postMessage({
          command: 'run',
        });
      });
    };

    const init = (curTimeMs: number) => {
      initTime = curTimeMs;
      lastUpdateTime = lastStatsTime = curTimeMs;
      renderTimeArr = new Float64Array(Engine.FRAME_TIME_ARR_LENGTH);
      timeAcc = 0;
      elapsedTime = 0;
      updateTimeArr = new Float64Array(Engine.UPD_TIME_ARR_LENGTH);
      updateTimeCount = 0;
      statsTimeAcc = 0;
      fpsArr = new Float32Array(Engine.FPS_ARR_LENGTH);
      upsArr = new Float32Array(Engine.FPS_ARR_LENGTH);
      fpsCount = 0;
      resync = false;
      frameCount = updateCount = 0;
      frameThen = performance.now();
      isRunning = true;
      isPaused = false;
      runWorkers();
      requestAnimationFrame(renderLoop);
    };

    const calcAvgArrValue = (values: TypedArray, count: number) => {
      let acc = 0;
      const numIter = Math.min(count, values.length);
      for (let i = 0; i < numIter; i++) {
        acc += values[i];
      }
      return acc / numIter;
    };

    const renderLoop = (curTimeMs: number) => {
      requestAnimationFrame(renderLoop);
      const startRenderTime = performance.now();
      let timeFromLastUpdate = curTimeMs - lastUpdateTime;
      const loopStartTime = (lastUpdateTime = curTimeMs);
      // if (is_paused) return; // TODO
      updateStats(timeFromLastUpdate, loopStartTime);
      // handle timer anomalies
      timeFromLastUpdate = Math.min(timeFromLastUpdate, Engine.UPDATE_TIME_MAX);
      timeFromLastUpdate = Math.max(timeFromLastUpdate, 0);
      updateTimeArr[updateTimeCount++ % updateTimeArr.length] =
        timeFromLastUpdate;
      timeFromLastUpdate = calcAvgArrValue(updateTimeArr, updateTimeCount);
      timeAcc += timeFromLastUpdate;
      // spiral of death protection
      if (timeAcc > Engine.UPDATE_TIME_MAX) {
        resync = true;
      }
      // timer resync if requested
      if (resync) {
        timeAcc = 0; // TODO
        // delta_time = App.UPD_PERIOD;
      }
      update();
      render(startRenderTime);
    };

    const update = () => {
      while (timeAcc >= Engine.UPDATE_PERIOD) {
        // TODO see multiplier in update_period def
        // update state with UPD_PERIOD
        // this.scene.update(STEP, t / MULTIPLIER);
        // gameUpdate(STEP, t / MULTIPLIER);
        timeAcc -= Engine.UPDATE_PERIOD;
        updateCount++;
      }
    };

    const render = (startRenderTime: number) => {
      const frameNow = performance.now();
      const elapsed = frameNow - frameThen;
      if (elapsed >= Engine.RENDER_PERIOD) {
        frameThen = frameNow - (elapsed % Engine.RENDER_PERIOD);
        this.renderFrame();
        const renderTime = performance.now() - startRenderTime;
        renderTimeArr[frameCount % renderTimeArr.length] = renderTime;
        frameCount++;
      }
    };

    const updateStats = (
      timeFromLastUpdate: number,
      loopStartTime: number,
    ): void => {
      statsTimeAcc += timeFromLastUpdate;
      if (statsTimeAcc >= Engine.STATS_PERIOD) {
        statsTimeAcc = 0;
        // const tspent = (tnow - start_time) / App.MILLI_IN_SEC;
        const elapsed = loopStartTime - lastStatsTime;
        lastStatsTime = loopStartTime;
        elapsedTime += elapsed;
        const fps = (frameCount * MILLI_IN_SEC) / elapsedTime;
        const ups = (updateCount * MILLI_IN_SEC) / elapsedTime;
        // console.log(`${fps} - ${ups}`);
        const fpsIdx = fpsCount++ % Engine.FPS_ARR_LENGTH;
        fpsArr[fpsIdx] = fps;
        upsArr[fpsIdx] = ups;
        if (this._engineConfig.sendStats) {
          const avgFps = Math.round(calcAvgArrValue(fpsArr, fpsCount));
          const avgUps = Math.round(calcAvgArrValue(upsArr, fpsCount));
          const avgMaxFps = Math.round(
            1000 / calcAvgArrValue(renderTimeArr, frameCount),
          );
          const stats: Partial<StatsValues> = {
            // TODO
            [StatsNames.FPS]: avgFps,
            [StatsNames.UPS]: avgUps,
            [StatsNames.UFPS]: avgMaxFps,
          };
          postMessage({
            command: 'updateStats',
            params: stats,
          });
        }
      }
    };

    requestAnimationFrame(init);
  }

  private renderFrame(): void {
    for (let i = 0; i < Engine.NUM_ENGINE_WORKERS; ++i) {
      syncStore(this._syncArr, i, 1);
      syncNotify(this._syncArr, i);
    }
    for (let i = 0; i < Engine.NUM_ENGINE_WORKERS; ++i) {
      syncWait(this._syncArr, i, 1);
    }
    this.updateImage();
  }

  private updateImage(): void {
    this._imageData.data.set(this._frameBuffer);
    this._ctx.putImageData(this._imageData, 0, 0);
  }

  // private showStats(): void {
  //   this.draw_text(
  //     `FPS: ${Math.round(this.avg_fps)}\nUPS: ${Math.round(this.avg_ups)}`,
  //   );
  // }

  // async loadImages() { // TODO
  //   await loadImageAsImageData(myImgUrl);
  // }
}

let engine: Engine;

const commands = {
  async run(config: EngineConfig): Promise<void> {
    engine = new Engine();
    await engine.init(config);
    engine.run();
  },
};

self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

export { EngineConfig, Engine };
