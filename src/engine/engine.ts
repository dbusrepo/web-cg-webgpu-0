import assert from 'assert';
import * as WasmMemUtils from './wasmMemUtils';
import {
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
import { defaultConfig } from '../config/config';
import { range, syncStore, syncWait, syncNotify } from './utils';

// import * as loadUtils from '../utils/loadFiles'; // TODO
import {
  WorkerConfig,
  WorkerWasmMemConfig,
  WorkerInitData,
  WasmMemViews,
} from './engineWorker';

// test img loading... TODO
// import myImgUrl from 'images/samplePNGImage.png';

type EngineConfig = {
  canvas: OffscreenCanvas;
  sendStats: boolean;
  usePalette: boolean;
};

// init data from all workers
type WorkersInitData = {
  numImages: number;
  totalImagesSize: number;
  workerImagesSizes: number[];
  workerImagesOffsets: number[];
  imagesOffsets: number[];
  imagesSizes: [number, number][];
};

type WasmMemConfigInput = {
  numPixels: number; // TODO rename?
  imagesRegionSize: number;
  startOffset: number;
  workerHeapPages: number;
  numWorkers: number;
};

class Engine {
  private static readonly NUM_WORKERS = 1; // >= 1

  // TODO
  private static readonly RENDER_PERIOD =
    MILLI_IN_SEC / defaultConfig.targetFPS;
  private static readonly UPDATE_PERIOD =
    (defaultConfig.multiplier * MILLI_IN_SEC) / defaultConfig.targetUPS;
  private static readonly UPDATE_TIME_MAX = Engine.UPDATE_PERIOD * 8;

  private static readonly UPD_TIME_ARR_LENGTH = 4;
  private static readonly FRAME_TIME_ARR_LENGTH = 8;

  private static readonly FPS_ARR_LENGTH = 8;
  private static readonly STATS_PERIOD = MILLI_IN_SEC;

  private _config: EngineConfig;
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _imageData: ImageData;
  private _startTime: number;

  private _imagesPaths: string[];

  private _workers: Worker[];
  private _workersInitData: WorkersInitData;

  private _wasmMemConfig: WasmMemUtils.MemConfig;
  private _wasmMemRegionsSizes: WasmMemUtils.MemRegionsData;
  private _wasmMemRegionsOffsets: WasmMemUtils.MemRegionsData;
  private _wasmMem: WebAssembly.Memory;

  private _wasmMemViews: WasmMemViews;

  public async init(config: EngineConfig): Promise<void> {
    this._startTime = Date.now();

    this._config = config;

    const { canvas } = config;

    this._initOffscreenCanvasContext(canvas);

    const { width: frameWidth, height: frameHeight } = canvas;
    this._imageData = this._ctx.createImageData(frameWidth, frameHeight);

    await this._initAssets();

    await this._initWorkers();

    // console.log(this._workersInitData);

    const wasmMemConfig: WasmMemConfigInput = {
      numPixels: frameWidth * frameHeight,
      imagesRegionSize: this._getWasmImagesRegionSize(),
      startOffset: defaultConfig.wasmMemStartOffset,
      workerHeapPages: defaultConfig.wasmWorkerHeapPages,
      numWorkers: Engine.NUM_WORKERS,
    };

    // console.log('wasm mem config: ', wasmMemConfig);

    this._buildWasmMemConfig(wasmMemConfig);

    const { wasmMemStartOffset } = defaultConfig;

    const wasmMemStartSize = WasmMemUtils.getMemStartSize(
      wasmMemStartOffset,
      this._wasmMemRegionsSizes,
      this._wasmMemRegionsOffsets,
    );

    console.log(`wasm mem start: ${defaultConfig.wasmMemStartOffset}`);
    console.log(`wasm mem size: ${wasmMemStartSize}`);

    const wasmMemTotalStartSize = wasmMemStartOffset + wasmMemStartSize;
    this.allocWasmMemory(wasmMemTotalStartSize);

    this._initWasmMemViews(wasmMemStartSize);

    await this.initWasmMemoryWorkers(wasmMemStartSize);
  }

  // not used
  // private _addImageIndex2WorkersOffsets(): void {
  //   const wasmImageIndexSize = WasmMemUtils.getImageIndexSize(this._imagesUrls.length);
  //   // update also worker images offsets with index size
  //   for (let workerIdx = 0; workerIdx < Engine.NUM_WORKERS; ++workerIdx) {
  //     this._workersInitData.wasmImagesOffsets[workerIdx] += wasmImageIndexSize;
  //   }
  // }

  private _getBPP(): number {
    const bpp = this._config.usePalette ? 1 : 4;
    return bpp;
  }

  private _getWasmImagesRegionSize(): number {
    const numImages = this._imagesPaths.length;
    const wasmImageIndexSize = WasmMemUtils.initImages.getImageIndexSizeBytes(numImages);
    return this._workersInitData.totalImagesSize + wasmImageIndexSize;
  }

  private async _initAssets() {
    await this._initImagesPaths();
  }

  private async _initImagesPaths() {
    const imgUrl = (await import('../assets/images/samplePNGImage.png')).default;
    const imgUrl2 = (await import('../assets/images/samplePNGImage2.png')).default;
    this._imagesPaths = [imgUrl, imgUrl2];
  }

  private _initOffscreenCanvasContext(canvas: OffscreenCanvas): void {
    const ctx = <OffscreenCanvasRenderingContext2D>(
      canvas.getContext('2d', { alpha: false })
    );
    ctx.imageSmoothingEnabled = false;
    this._ctx = ctx;
  }

  private _buildWasmMemConfig(wasmMemConfigInput: WasmMemConfigInput): void {
    const { startOffset, workerHeapPages, numPixels, imagesRegionSize, numWorkers } =
      wasmMemConfigInput;
    const wasmMemConfig: WasmMemUtils.MemConfig = {
      startOffset,
      frameBufferRGBASize: numPixels * BPP_RGBA,
      frameBufferPalSize: this._config.usePalette ? numPixels : 0,
      paletteSize: this._config.usePalette ? PALETTE_SIZE * PAL_ENTRY_SIZE : 0,
      syncArraySize: (numWorkers + 1) * Int32Array.BYTES_PER_ELEMENT,
      sleepArraySize: (numWorkers + 1) * Int32Array.BYTES_PER_ELEMENT,
      numWorkers,
      workerHeapSize: PAGE_SIZE_BYTES * workerHeapPages,
      imagesRegionSize,
    };
    this._wasmMemConfig = wasmMemConfig;
    this._wasmMemRegionsSizes = WasmMemUtils.buildMemRegionSizesData(
      this._wasmMemConfig,
    );
    this._wasmMemRegionsOffsets = WasmMemUtils.buildMemRegionsDataOffsets(
      this._wasmMemConfig,
      this._wasmMemRegionsSizes,
    );
    console.log(this._wasmMemRegionsSizes);
    console.log(this._wasmMemRegionsOffsets);
  }

  private _initWasmMemViews(wasmMemStartSize: number): void {

    const memSizes = this._wasmMemRegionsSizes;
    const memOffsets = this._wasmMemRegionsOffsets;
    const workerIdx = Engine.NUM_WORKERS;

    this._wasmMemViews = new WasmMemViews(
      this._wasmMem,
      defaultConfig.wasmMemStartOffset,
      wasmMemStartSize,
      memOffsets,
      memSizes,
      this._workersInitData.numImages,
      workerIdx,
    );
  }

  private _buildWorkerConfig(workerIdx: number): WorkerConfig {
    return {
      workerIdx,
      numWorkers: Engine.NUM_WORKERS,
      frameWidth: this._config.canvas.width,
      frameHeight: this._config.canvas.height,
      imageUrls: this._images2LoadWorker(workerIdx),
      usePalette: this._config.usePalette,
    };
  }

  private _images2LoadWorker(workerIdx: number): string[] {
    const [start, end] = range(
      workerIdx,
      Engine.NUM_WORKERS,
      this._imagesPaths.length,
    );
    return this._imagesPaths.slice(start, end);
  }

  private _buildWorkerWasmMemoryConfig(
    workerIdx: number,
    wasmMemStartSize: number,
  ): WorkerWasmMemConfig {
    return {
      wasmMemStartOffset: defaultConfig.wasmMemStartOffset,
      wasmWorkerHeapSize: defaultConfig.wasmWorkerHeapPages * PAGE_SIZE_BYTES,
      wasmMemStartSize,
      wasmMem: this._wasmMem,
      wasmMemRegionsSizes: this._wasmMemRegionsSizes,
      wasmMemRegionsOffsets: this._wasmMemRegionsOffsets,
      wasmNumImages: this._workersInitData.numImages,
      wasmImagesIndexOffset:
        this._wasmMemRegionsOffsets[WasmMemUtils.MemRegions.IMAGES],
      wasmWorkerImagesOffsets: this._workersInitData.workerImagesOffsets,
      wasmImagesSizes: this._workersInitData.imagesSizes,
      wasmWorkerImagesSize: this._workersInitData.workerImagesSizes,
      wasmImagesOffsets: this._workersInitData.imagesOffsets,
    };
  }

  private allocWasmMemory(wasmMemSize: number): void {
    console.log(
      `wasm mem pages required: ${Math.ceil(wasmMemSize / PAGE_SIZE_BYTES)}`,
    );
    const { wasmMemStartPages: initial, wasmMemMaxPages: maximum } =
      defaultConfig;
    console.log(`wasm mem start pages: ${initial}`);
    assert(initial * PAGE_SIZE_BYTES >= wasmMemSize);
    const memory = new WebAssembly.Memory({
      initial,
      maximum,
      shared: true,
    });
    this._wasmMem = memory;
  }

  private async initWasmMemoryWorkers(wasmMemStartSize: number): Promise<void> {
    let workerCount = Engine.NUM_WORKERS;
    const initStart = Date.now();
    console.log('Initializing wasm memory with workers...');
    // this._addImageIndex2WorkersOffsets();
    return new Promise((resolve, reject) => {
      for (let workerIdx = 0; workerIdx < Engine.NUM_WORKERS; ++workerIdx) {
        const worker = this._workers[workerIdx];
        worker.onmessage = ({ data: msg }) => {
          --workerCount;
          console.log(
            `Worker id=${workerIdx} wasm mem ready, count=${workerCount}, time=${
              Date.now() - initStart
            }ms`,
          );
          if (!workerCount) {
            console.log(
              `All workers ready. Wasm memory initiliazed. After ${
                Date.now() - this._startTime
              }ms`,
            );
            resolve();
          }
        };
        worker.onerror = (error) => {
          console.log(`Worker id=${workerIdx} error: ${error.message}\n`);
          reject(error);
        };
        const workerConfig = this._buildWorkerWasmMemoryConfig(workerIdx, wasmMemStartSize);
        worker.postMessage({
          command: 'initWasm',
          params: workerConfig,
        });
      }
    });
  }

  private async _initWorkers(): Promise<void> {
    assert(Engine.NUM_WORKERS >= 1);

    this._workers = [];
    this._workersInitData = {
      numImages: 0, // updated later
      totalImagesSize: 0,
      workerImagesOffsets: new Array(Engine.NUM_WORKERS).fill(0),
      workerImagesSizes: new Array(Engine.NUM_WORKERS),
      imagesSizes: [],
      imagesOffsets: [], 
    };

    // offset used to fill the sizes array (with [w,h]) in worker order in updateWorkersData
    const workerSizesOffsets: number[] = new Array(Engine.NUM_WORKERS).fill(0);

    const updateWorkersNumImagesOffset = (
      workerIdx: number,
      workerConfig: WorkerConfig,
    ) => {
      for (
        let nextWorker = workerIdx + 1;
        nextWorker < Engine.NUM_WORKERS;
        nextWorker++
      ) {
        workerSizesOffsets[nextWorker] += workerConfig.imageUrls.length;
      }
    };

    const updateWorkersData = (workerIdx: number, workerData: WorkerInitData) => {
      this._workersInitData.workerImagesSizes[workerIdx] = workerData.totalImagesSize;
      this._workersInitData.totalImagesSize += workerData.totalImagesSize;
      // update wasm mem image offsets for workers that follow workerIdx
      for (
        let nextWorker = workerIdx + 1;
        nextWorker < Engine.NUM_WORKERS;
        nextWorker++
      ) {
        this._workersInitData.workerImagesOffsets[nextWorker] +=
          workerData.totalImagesSize;
      }
      // insert the sizes for images from worker idx
      for (
        let i = 0, j = workerSizesOffsets[workerIdx];
        i < workerData.imagesSizes.length;
        ++i, ++j
      ) {
        this._workersInitData.imagesSizes[j] = workerData.imagesSizes[i];
      }
      this._workersInitData.numImages += workerData.imagesSizes.length;
        // this._workersInitData.imagesSizes.splice(
      //   workerSizesOffset[workerIdx],
      //   0,
      //   ...workerData.imagesSizes,
      // );
      // console.log(
      //   'worker ' + workerIdx + ' inserting ',
      //   workerData.imagesSizes,
      //   ' at pos ' + workerSizesOffset[workerIdx],
      // );
    };

    const workerPostInit = () => {
      // some checks
      assert(
        this._workersInitData.numImages === this._imagesPaths.length,
      );
      // calc images offsets
      const calcImagesOffsets = () => {
        const numImages = this._workersInitData.imagesSizes.length;
        const imagesOffsets = new Array<number>(numImages);
        let prevSize: number;
        imagesOffsets[0] = WasmMemUtils.initImages.getImageIndexSizeBytes(numImages);
        this._workersInitData.imagesSizes.forEach(([w, h], idx) => {
          const imageSize = w * h * this._getBPP(); // TODO use img info !
          if (idx > 0) {
            imagesOffsets[idx] = imagesOffsets[idx - 1] + prevSize;
          }
          prevSize = imageSize;
        });
        this._workersInitData.imagesOffsets = imagesOffsets;
      };

      calcImagesOffsets();
    };


    let workerCount = Engine.NUM_WORKERS;
    const initStart = Date.now();

    console.log('Initializing workers...');
    return new Promise((resolve, reject) => {
      for (let workerIdx = 0; workerIdx < Engine.NUM_WORKERS; ++workerIdx) {
        const worker = new Worker(
          new URL('./engineWorker.ts', import.meta.url),
          {
            name: `worker-${workerIdx}`,
            type: 'module',
          },
        );
        this._workers.push(worker);
        worker.onmessage = ({ data: initData }) => {
          updateWorkersData(workerIdx, initData);
          --workerCount;
          console.log(
            `Worker id=${workerIdx} init, count=${workerCount}, time=${
              Date.now() - initStart
            }ms with data = ${JSON.stringify(initData)}`,
          );
          if (workerCount === 0) {
            console.log(`Workers init done. After ${Date.now() - this._startTime}ms`);
            workerPostInit();
            resolve();
          }
        };
        worker.onerror = (error) => {
          console.log(`Worker id=${workerIdx} error: ${error.message}\n`);
          reject(error);
        };
        const workerConfig = this._buildWorkerConfig(workerIdx);
        updateWorkersNumImagesOffset(workerIdx, workerConfig);
        worker.postMessage({
          command: 'init',
          params: workerConfig,
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

    const calcAvgArrValue = (values: Float32Array | Float64Array, count: number) => {
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
        this.drawFrame();
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
        if (this._config.sendStats) {
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

  private _syncWorkers(): void {
    for (let i = 0; i < Engine.NUM_WORKERS; ++i) {
      syncStore(this._wasmMemViews.syncArr, i, 1);
      syncNotify(this._wasmMemViews.syncArr, i);
    }
    for (let i = 0; i < Engine.NUM_WORKERS; ++i) {
      syncWait(this._wasmMemViews.syncArr, i, 1);
    }
  }

  private drawFrame(): void {
    this._syncWorkers();
    this._imageData.data.set(this._wasmMemViews.frameBufferRGBA);
    this._ctx.putImageData(this._imageData, 0, 0);
  }

  // private showStats(): void {
  //   this.draw_text(
  //     `FPS: ${Math.round(this.avg_fps)}\nUPS: ${Math.round(this.avg_ups)}`,
  //   );
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
