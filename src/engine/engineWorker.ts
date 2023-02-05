import assert from 'assert';
import { fileTypeFromBuffer } from 'file-type';
import * as WasmUtils from './wasmMemUtils';
import { WasmModules, WasmInput, loadWasmModules } from './wasmInit';
import { syncStore, randColor, sleep } from './utils';
import * as loadUtils from './loadUtils';
import { BitImage } from './assets/images/bitImage';
import { BitImageRGBA } from './assets/images/bitImageRGBA';
import { PngDecoderRGBA } from './assets/images/vivaxy-png/PngDecoderRGBA';
import { loadImagesInitData, loadImageRGBA } from './assets/images/utils';
import { WorkerInitImagesData } from './workerInitTypes';
import { FONT_X_SIZE, FONT_Y_SIZE, FONT_SPACING } from '../assets/fonts/font';
import type { WorkerInitData } from './workerInitTypes';
import Commands from './engineWorkerCommands';

type WorkerConfig = {
  workerIdx: number;
  numWorkers: number;
  frameWidth: number;
  frameHeight: number;
  imageUrls: string[];
  usePalette: boolean;
};

type WorkerWasmMemConfig = {
  wasmMem: WebAssembly.Memory;
  wasmMemRegionsOffsets: WasmUtils.MemRegionsData;
  wasmMemRegionsSizes: WasmUtils.MemRegionsData;
  wasmWorkerHeapSize: number;
  wasmImagesIndexOffset: number; // images region starts here
  wasmImagesIndexSize: number;
  wasmWorkerImagesOffsets: number[]; // worker images offsets
  wasmWorkerImagesSize: number[]; // worker images total size
  wasmImagesSizes: [number, number][]; // [w, h] for each image
  wasmImagesOffsets: number[]; // image offsets from the beg of the image region
};

type AssetsBuffers = {
  images: ArrayBuffer[];
};

type WasmMemViews = WasmUtils.initViews.WasmMemViews;

class EngineWorker {
  private _config: WorkerConfig;
  private _assetBuffers: AssetsBuffers;
  // the images loaded by this worker, used in init
  private _images: BitImage[]; // RGBA, PAL_IDX ?
  private _workerWasmMemConfig: WorkerWasmMemConfig;
  // private _wasmInitInput: WasmInput;
  private _wasmMemViews: WasmMemViews;
  private _wasmModules: WasmModules;

  // private _sab: SharedArrayBuffer;

  public async init(config: WorkerConfig): Promise<WorkerInitData> {
    this._config = config;

    // test load res file as text
    // const resFile = (await import('../assets/images/images.res')).default;
    // console.log('RES HERE: ', await loadUtils.loadResAsText(resFile));

    await this._initAssetsBuffers();
    return { ...(await loadImagesInitData(this._assetBuffers.images)) };
  }

  private async _initAssetsBuffers() {
    const imageBuffers = await this._loadImageBuffers();
    this._assetBuffers = {
      images: imageBuffers,
    };
  }

  private async _loadImageBuffers(): Promise<ArrayBuffer[]> {
    // console.log('worker ', this._config.workerIdx, this._config.imageUrls);
    const imageBuffers = await Promise.all(
      this._config.imageUrls.map(async (url) =>
        loadUtils.loadResAsArrayBuffer(url),
      ),
    );
    return imageBuffers;
  }

  async loadAssets() {
    await this._loadImages();
  }

  private async _loadImages() {
    const loadImageFromBuffer = async (
      imgBuffer: ArrayBuffer,
    ): Promise<BitImage> => {
      if (this._config.usePalette) {
        throw new Error('not yet impl');
      } else {
        return loadImageRGBA(imgBuffer);
      }
    };
    this._images = await Promise.all(
      this._assetBuffers.images.map(loadImageFromBuffer),
    );
  }

  public async initWasm(config: WorkerWasmMemConfig): Promise<void> {
    this._workerWasmMemConfig = config;
    this._initWasmMemViews();
    this._initWasmMem();
    await this.initWasmModules();
  }

  private _initWasmMemViews(): void {
    const {
      wasmMem: mem,
      wasmMemRegionsOffsets: memOffsets,
      wasmMemRegionsSizes: memSizes,
    } = this._workerWasmMemConfig;

    const { workerIdx } = this._config;

    this._wasmMemViews = WasmUtils.initViews.buildWasmMemViews(
      mem,
      memOffsets,
      memSizes,
      workerIdx,
    );
  }

  private _initWasmMem() {
    console.log('Init wasm memory...');

    // write the loaded images pixels arr to wasm mem
    // first get the offset to images loaded by this worker inside images region
    const workerImagesOffset =
      this._wasmMemViews.imagesPixels.byteOffset +
      this._workerWasmMemConfig.wasmWorkerImagesOffsets[this._config.workerIdx];

    // then get a uint8 view
    const workerImagesPixels = new Uint8Array(
      this._wasmMemViews.imagesPixels.buffer,
      workerImagesOffset,
      this._workerWasmMemConfig.wasmWorkerImagesSize[this._config.workerIdx],
    );

    // copy the images loaded to wasm mem
    for (let i = 0, imgOffset = 0; i < this._images.length; ++i) {
      const { pixels } = this._images[i];
      workerImagesPixels.set(pixels, imgOffset);
      imgOffset += pixels.length;
    }
  }

  private async initWasmModules(): Promise<void> {
    const {
      wasmMem: memory,
      wasmMemRegionsSizes: memSizes,
      wasmMemRegionsOffsets: memOffsets,
      wasmWorkerHeapSize: workerHeapSize,
    } = this._workerWasmMemConfig;

    const { frameWidth, frameHeight, numWorkers, workerIdx } = this._config;

    const logf = (f: number) =>
      console.log(`[wasm] Worker [${workerIdx}]: ${f}`);
    const logi = (i: number) => {
      // console.trace();
      console.log(`[wasm] Worker [${workerIdx}]: ${i}`);
    };

    const wasmImports: WasmInput = {
      memory,
      frameWidth,
      frameHeight,
      frameBufferPtr: memOffsets[WasmUtils.MemRegions.FRAMEBUFFER_RGBA],
      syncArrayPtr: memOffsets[WasmUtils.MemRegions.SYNC_ARRAY],
      sleepArrayPtr: memOffsets[WasmUtils.MemRegions.SLEEP_ARRAY],
      workerIdx,
      numWorkers,
      workersHeapPtr: memOffsets[WasmUtils.MemRegions.WORKERS_HEAPS],
      workerHeapSize,
      heapPtr: memOffsets[WasmUtils.MemRegions.HEAP],
      bgColor: randColor(),
      usePalette: this._config.usePalette ? 1 : 0,
      fontCharsPtr: memOffsets[WasmUtils.MemRegions.FONT_CHARS],
      fontCharsSize: memSizes[WasmUtils.MemRegions.FONT_CHARS],
      numImages: this._workerWasmMemConfig.wasmImagesSizes.length,
      imagesIndexSize: memSizes[WasmUtils.MemRegions.IMAGES_INDEX],
      imagesIndexPtr: memOffsets[WasmUtils.MemRegions.IMAGES_INDEX],
      imagesDataPtr: memOffsets[WasmUtils.MemRegions.IMAGES],
      imagesDataSize: memSizes[WasmUtils.MemRegions.IMAGES],
      stringsDataPtr: memOffsets[WasmUtils.MemRegions.STRINGS],
      stringsDataSize: memSizes[WasmUtils.MemRegions.STRINGS],
      workersMemCountersPtr:
        memOffsets[WasmUtils.MemRegions.WORKERS_MEM_COUNTERS],
      workersMemCountersSize:
        memSizes[WasmUtils.MemRegions.WORKERS_MEM_COUNTERS],
      inputKeysPtr: memOffsets[WasmUtils.MemRegions.INPUT_KEYS],
      inputKeysSize: memSizes[WasmUtils.MemRegions.INPUT_KEYS],

      FONT_X_SIZE,
      FONT_Y_SIZE,
      FONT_SPACING,

      logi,
      logf,
    };

    // this._wasmInitInput = wasmInput; // save it ?
    this._wasmModules = await loadWasmModules(wasmImports);
  }

  run(): void {
    console.log(`Worker ${this._config.workerIdx} running!`);
    try {
      this._wasmModules.engineWorker.run();
    } catch (e) {
      console.log(e);
    }
  }
}

let worker: EngineWorker;

const commands = {
  [Commands.INIT]: async (config: WorkerConfig): Promise<void> => {
    worker = new EngineWorker();
    const initData = await worker.init(config);
    postMessage(initData);
  },
  [Commands.INIT_WASM]: async (config: WorkerWasmMemConfig): Promise<void> => {
    assert(worker);
    await worker.loadAssets();
    await worker.initWasm(config);
    postMessage('ready');
  },
  run(): void {
    worker.run();
  },
};

self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

export { EngineWorker, WorkerConfig, WorkerWasmMemConfig, WasmMemViews };

export type { WorkerInitData, WorkerInitImagesData } from './workerInitTypes';
