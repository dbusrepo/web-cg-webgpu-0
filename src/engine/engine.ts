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

import { images, getImagesPaths } from '../assets/images/imagesList';
import {
  strings,
  stringsArrayData,
} from '../assets/strings/strings';

import { FONT_Y_SIZE, fontChars } from '../assets/fonts/font';

// import loader from '@assemblyscript/loader';
// import assert from 'assert';
import { defaultConfig } from '../config/config';
import * as utils from './utils';

import { InputManager, KeyCode } from './input/inputManager'; 

// import * as loadUtils from '../utils/loadFiles'; // TODO
import {
  WorkerConfig,
  WorkerWasmMemConfig,
  WorkerInitData,
  WasmMemViews,
} from './engineWorker';

type EngineConfig = {
  canvas: OffscreenCanvas;
  sendStats: boolean;
  usePalette: boolean; // TODO move to def config?
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

class Engine {
  private static readonly NUM_WORKERS = 1; // >= 1
  private static readonly MAIN_WORKER_IDX = this.NUM_WORKERS;

  private static readonly RENDER_PERIOD =
    MILLI_IN_SEC / defaultConfig.targetFPS;

  private static readonly UPDATE_PERIOD =
    (defaultConfig.multiplier * MILLI_IN_SEC) / defaultConfig.targetUPS;

  private static readonly STATS_PERIOD = MILLI_IN_SEC;

  private static readonly UPDATE_TIME_MAX = Engine.UPDATE_PERIOD * 8;

  private static readonly STATS_ARR_LENGTH = 8;
  private static readonly TIME_LAST_FRAME_ARR_LENGTH = 4;
  private static readonly FRAME_TIME_ARR_LENGTH = 8;

  private _config: EngineConfig;
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _imageData: ImageData;
  private _startTime: number;

  private _imagesPaths: string[];

  private _workers: Worker[];
  private _workersInitData: WorkersInitData;

  private _wasmMem: WebAssembly.Memory;
  private _wasmMemConfig: WasmUtils.MemConfig;
  private _wasmMemRegionsSizes: WasmUtils.MemRegionsData;
  private _wasmMemRegionsOffsets: WasmUtils.MemRegionsData;
  private _workerWasmMemConfig: WorkerWasmMemConfig;

  private _wasmMemViews: WasmMemViews;

  private _inputManager: InputManager;

  public async init(config: EngineConfig): Promise<void> {
    this._startTime = Date.now();
    this._config = config;
    const { canvas } = config;
    this._initOffscreenCanvasContext(canvas);
    this._imageData = this._ctx.createImageData(canvas.width, canvas.height);
    await this._initAssets();
    await this._initWorkers();
    // console.log(this._workersInitData);
    await this._initWasmMem();
    this._initInputManager();
  }

  private _initInputManager() {
    this._inputManager = new InputManager();
    this._inputManager.init();
    const onkey = (key: KeyCode, down: boolean) => {
      // console.log('key ', key, ' state: ', down);
      // map key to index
      const idx = 0;
      this._wasmMemViews.inputKeys[idx] = down ? 1 : 0;
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

  // not used TODO remove?
  // private _addImageIndex2WorkersOffsets(): void {
  //   const wasmImageIndexSize = WasmMemUtils.getImageIndexSize(this._imagesUrls.length);
  //   // update also worker images offsets with index size
  //   for (let workerIdx = 0; workerIdx < Engine.NUM_WORKERS; ++workerIdx) {
  //     this._workersInitData.wasmImagesOffsets[workerIdx] += wasmImageIndexSize;
  //   }
  // }

  private _getBPP(): number {
    return this._config.usePalette ? BPP_PAL : BPP_RGBA;
  }

  private async _initAssets() {
    await this._initImagesPaths();
  }

  private async _initImagesPaths() {
    this._imagesPaths = await getImagesPaths();
    assert(this._imagesPaths.length === Object.keys(images).length);
    // console.log(this._imagesPaths);
  }

  private _initOffscreenCanvasContext(canvas: OffscreenCanvas): void {
    const ctx = <OffscreenCanvasRenderingContext2D>(
      canvas.getContext('2d', { alpha: false })
    );
    ctx.imageSmoothingEnabled = false;
    this._ctx = ctx;
  }

  private _buildWasmMemConfig(): void {
    const startOffset = defaultConfig.wasmMemStartOffset;
    const numPixels = this._imageData.width * this._imageData.height;
    const imagesIndexSize = WasmUtils.initImages.getImagesIndexSize();
    const imagesRegionSize = this._workersInitData.totalImagesSize;
    const workerHeapPages = defaultConfig.wasmWorkerHeapPages;
    const numWorkers = Engine.NUM_WORKERS;
    const stringsRegionSize = stringsArrayData.length;

    // set wasm mem regions sizes
    const wasmMemConfig: WasmUtils.MemConfig = {
      startOffset,
      frameBufferRGBASize: numPixels * BPP_RGBA,
      frameBufferPalSize: this._config.usePalette ? numPixels : 0,
      paletteSize: this._config.usePalette ? PALETTE_SIZE * PAL_ENTRY_SIZE : 0,
      syncArraySize: (numWorkers + 1) * Int32Array.BYTES_PER_ELEMENT,
      sleepArraySize: (numWorkers + 1) * Int32Array.BYTES_PER_ELEMENT,
      numWorkers,
      workerHeapSize: PAGE_SIZE_BYTES * workerHeapPages,
      sharedHeapSize: defaultConfig.wasmSharedHeapSize,
      fontCharsSize: fontChars.length * FONT_Y_SIZE,
      stringsSize: stringsRegionSize,
      imagesIndexSize,
      imagesSize: imagesRegionSize,
      workersMemCountersSize: numWorkers * Uint32Array.BYTES_PER_ELEMENT,
      inputKeysSize: 4 * Uint8Array.BYTES_PER_ELEMENT,
    };

    this._wasmMemConfig = wasmMemConfig;
    const [sizes, offsets] = WasmUtils.getMemRegionsSizesAndOffsets(
      this._wasmMemConfig,
    );
    this._wasmMemRegionsSizes = sizes;
    this._wasmMemRegionsOffsets = offsets;
    console.log('SIZES: ', JSON.stringify(this._wasmMemRegionsSizes));
    console.log('OFFSETS: ', JSON.stringify(this._wasmMemRegionsOffsets));
  }

  private async _initWasmMem(): Promise<void> {
    this._buildWasmMemConfig();

    console.log(
      `wasm mem start offset: ${
        this._wasmMemRegionsOffsets[WasmUtils.MemRegions.START_MEM]
      }`,
    );
    console.log(
      `wasm mem start size: ${
        this._wasmMemRegionsSizes[WasmUtils.MemRegions.START_MEM]
      }`,
    );

    this._allocWasmMemory();
    this._initWasmMemViews();
    this._initWorkerWasmMemConfig();
    this._initWasmMemAssets();
    await this._initWasmMemoryWorkers();
  }

  private _initWasmMemViews(): void {
    const memSizes = this._wasmMemRegionsSizes;
    const memOffsets = this._wasmMemRegionsOffsets;

    this._wasmMemViews = WasmUtils.initViews.buildWasmMemViews(
      this._wasmMem,
      memOffsets,
      memSizes,
      Engine.MAIN_WORKER_IDX,
    );
  }

  private _initWasmMemAssets(): void {
    this._initWasmFontChars();
    this._initWasmStrings();
    this._initWasmImages();
  }

  private _initWasmFontChars() {
    WasmUtils.initFontChars.writeFontCharsData(this._wasmMemViews.fontChars);
  }

  private _initWasmStrings() {
    WasmUtils.initStrings.writeStringsData(this._wasmMemViews.strings);
  }

  private _initWasmImages(): void {
    // write only the index here,
    // in _initWasmMemoryWorkers the workers write the images they loaded
    WasmUtils.initImages.writeImagesIndex(
      this._wasmMemViews.imagesIndex,
      this._workerWasmMemConfig.wasmImagesOffsets,
      this._workerWasmMemConfig.wasmImagesSizes,
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
    const [start, end] = utils.range(
      workerIdx,
      Engine.NUM_WORKERS,
      this._imagesPaths.length,
    );
    return this._imagesPaths.slice(start, end);
  }

  private _initWorkerWasmMemConfig() {
    this._workerWasmMemConfig = {
      wasmMem: this._wasmMem,
      wasmWorkerHeapSize: defaultConfig.wasmWorkerHeapPages * PAGE_SIZE_BYTES,
      wasmMemRegionsSizes: this._wasmMemRegionsSizes,
      wasmMemRegionsOffsets: this._wasmMemRegionsOffsets,
      wasmImagesIndexOffset:
        this._wasmMemRegionsOffsets[WasmUtils.MemRegions.IMAGES],
      wasmImagesIndexSize: WasmUtils.initImages.getImagesIndexSize(),
      wasmWorkerImagesOffsets: this._workersInitData.workerImagesOffsets,
      wasmImagesSizes: this._workersInitData.imagesSizes,
      wasmWorkerImagesSize: this._workersInitData.workerImagesSizes,
      wasmImagesOffsets: this._workersInitData.imagesOffsets,
    };
  }

  private _allocWasmMemory(): void {
    const startSize = this._wasmMemRegionsSizes[WasmUtils.MemRegions.START_MEM];
    const startOffset =
      this._wasmMemRegionsOffsets[WasmUtils.MemRegions.START_MEM];
    const wasmMemStartTotalSize = startOffset + startSize;
    console.log(
      `wasm mem pages required: ${Math.ceil(
        wasmMemStartTotalSize / PAGE_SIZE_BYTES,
      )}`,
    );
    const { wasmMemStartPages: initial, wasmMemMaxPages: maximum } =
      defaultConfig;
    console.log(`wasm mem start pages: ${initial}`);
    assert(initial * PAGE_SIZE_BYTES >= wasmMemStartTotalSize);
    const memory = new WebAssembly.Memory({
      initial,
      maximum,
      shared: true,
    });
    this._wasmMem = memory;
  }

  private async _initWasmMemoryWorkers(): Promise<void> {
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
            `Worker id=${workerIdx} wasm mem ready, count=${workerCount}, 
             time=${Date.now() - initStart}ms`,
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
        worker.postMessage({
          command: 'initWasm',
          params: this._workerWasmMemConfig,
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

    const updateWorkersData = (
      workerIdx: number,
      workerData: WorkerInitData,
    ) => {
      this._workersInitData.workerImagesSizes[workerIdx] =
        workerData.totalImagesSize;
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
      // check all images buffers loaded
      assert(this._workersInitData.numImages === this._imagesPaths.length);
      // calc images offsets
      const calcImagesOffsets = () => {
        const numImages = this._workersInitData.imagesSizes.length;
        const imagesOffsets = new Array<number>(numImages);
        let prevSize: number;
        imagesOffsets[0] = 0; // start from images data and not from index
        // (images region start) //WasmUtils.initImages.getImageIndexSize(numImages);
        this._workersInitData.imagesSizes.forEach(([w, h], idx) => {
          const imageSize = w * h * this._getBPP();
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
            console.log(
              `Workers init done. After ${Date.now() - this._startTime}ms`,
            );
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

    const runWorkers = (): void => {
      this._workers.forEach((worker) => {
        worker.postMessage({
          command: 'run',
        });
      });
    };

    const getTimeMs = () => performance.now();

    const mainLoopInit = () => {
      lastFrameStartTime = lastStatsTime = getTimeMs();
      renderFrameTimeArr = new Float64Array(Engine.FRAME_TIME_ARR_LENGTH);
      updTimeAcc = 0;
      elapsedTime = 0;
      timeSinceLastFrameArr = new Float64Array(Engine.TIME_LAST_FRAME_ARR_LENGTH);
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
      runWorkers();
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
        if (this._config.sendStats) {
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
          const workersHeapMem = this._wasmMemViews.workersMemCounters.reduce(
            (tot, cnt) => tot + cnt,
            0,
          );
          const stats: Partial<StatsValues> = {
            [StatsNames.FPS]: avgFps,
            [StatsNames.UPS]: avgUps,
            [StatsNames.UFPS]: avgUnlockedFps,
            [StatsNames.WASM_HEAP]: workersHeapMem,
          };
          // console.log(avgUnlockedFps);
          // console.log(renderFrameTimeArr);
          postMessage({
            command: 'updateStats',
            params: stats,
          });
        }
      }
    };

    requestAnimationFrame(mainLoopInit);
  }

  private _syncWorkers(): void {
    for (let i = 0; i < Engine.NUM_WORKERS; ++i) {
      utils.syncStore(this._wasmMemViews.syncArr, i, 1);
      utils.syncNotify(this._wasmMemViews.syncArr, i);
    }
    for (let i = 0; i < Engine.NUM_WORKERS; ++i) {
      utils.syncWait(this._wasmMemViews.syncArr, i, 1);
    }
  }

  private drawFrame(): void {
    this._syncWorkers();
    // utils.sleep(this._wasmMemViews.sleepArr, Engine.MAIN_WORKER_IDX, 16);
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
  keydown(key: KeyCode) {
    engine.onKeyDown(key);
  },
  keyup(key: KeyCode) {
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
