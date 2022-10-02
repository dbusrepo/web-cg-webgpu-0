import assert from 'assert';
import { fileTypeFromBuffer } from 'file-type';
import * as WasmUtils from './wasmMemUtils';
import { WasmModules, WasmInput, loadWasmModules } from './initWasm';
import { syncStore, randColor, sleep } from './utils';
import * as loadUtils from './loadUtils';
import { BitImage } from './assets/images/bitImage';
import { BitImageRGBA } from './assets/images/bitImageRGBA';
import { PngDecoderRGBA } from './assets/images/vivaxy-png/PngDecoderRGBA';
import { loadImagesInitData, loadImageRGBA } from './assets/images/utils';
import { WorkerInitData, WorkerInitImagesData } from './workerInitTypes';

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
  wasmMemStartOffset: number;
  wasmMemStartSize: number;
  wasmMemRegionsOffsets: WasmUtils.MemRegionsData;
  wasmMemRegionsSizes: WasmUtils.MemRegionsData;
  wasmWorkerHeapSize: number;
  wasmNumImages: number;
  wasmImagesIndexOffset: number; // images region starts here
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
  private _wasmMemConfig: WorkerWasmMemConfig;
  // private _wasmInitInput: WasmInput;
  private _wasmMemViews: WasmMemViews;
  private _wasmModules: WasmModules;

  // private _sab: SharedArrayBuffer;

  public async init(config: WorkerConfig): Promise<WorkerInitData> {
    this._config = config;
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
    this._wasmMemConfig = config;
    this._initWasmMemViews();
    this._initWasmMem();
    await this.initWasmModules();
  }

  private _initWasmMemViews(): void {
    const {
      wasmMem: mem,
      wasmMemStartOffset: startOffs,
      wasmMemStartSize: startSize,
      wasmMemRegionsOffsets: memOffsets,
      wasmMemRegionsSizes: memSizes,
    } = this._wasmMemConfig;

    const { wasmNumImages: numImages } = this._wasmMemConfig;
    const { workerIdx } = this._config;

    this._wasmMemViews = WasmUtils.initViews.buildWasmMemViews(
      mem,
      startOffs,
      startSize,
      memOffsets,
      memSizes,
      numImages,
      workerIdx,
    );
  }

  private _initWasmMem() {
    console.log('Init wasm memory...');
    if (this._config.workerIdx === 0) {
      // worker 0 writes the images index
      WasmUtils.initImages.writeImageIndex(
        this._wasmMemViews.imagesIndex,
        this._wasmMemConfig.wasmImagesOffsets,
        this._wasmMemConfig.wasmImagesSizes,
      );
    }

    // write the loaded images to wasm mem
    const workerImagesOffset =
      this._wasmMemViews.imagesPixels.byteOffset +
      this._wasmMemConfig.wasmWorkerImagesOffsets[this._config.workerIdx];

    // get a uint8 view on worker images pixels
    const workerImagesPixels = new Uint8Array(
      this._wasmMemViews.imagesPixels.buffer,
      workerImagesOffset,
      this._wasmMemConfig.wasmWorkerImagesSize[this._config.workerIdx],
    );

    // copy loaded images pixels to wasm mem
    for (let i = 0, imgOffset = 0; i < this._images.length; ++i) {
      const { pixels } = this._images[i];
      workerImagesPixels.set(pixels, imgOffset);
      imgOffset += pixels.length;
    }
  }

  private async initWasmModules(): Promise<void> {
    const {
      wasmMem: memory,
      wasmMemRegionsOffsets: memOffsets,
      wasmWorkerHeapSize: workerHeapSize,
    } = this._wasmMemConfig;

    const { frameWidth, frameHeight, numWorkers, workerIdx } = this._config;

    const logf = (f: number) =>
      console.log(`[wasm] Worker [${workerIdx}]: ${f}`);
    const logi = (i: number) => {
      // console.trace();
      console.log(`[wasm] Worker [${workerIdx}]: ${i}`);
    };

    const wasmInput: WasmInput = {
      memory,
      frameWidth,
      frameHeight,
      frameBufferOffset: memOffsets[WasmUtils.MemRegions.FRAMEBUFFER_RGBA],
      syncArrayOffset: memOffsets[WasmUtils.MemRegions.SYNC_ARRAY],
      sleepArrayOffset: memOffsets[WasmUtils.MemRegions.SLEEP_ARRAY],
      imagesIndexOffset: memOffsets[WasmUtils.MemRegions.IMAGES],
      numImages: this._wasmMemConfig.wasmImagesSizes.length,
      workerIdx,
      numWorkers,
      workersHeapOffset: memOffsets[WasmUtils.MemRegions.WORKERS_HEAPS],
      workerHeapSize,
      heapOffset: memOffsets[WasmUtils.MemRegions.HEAP],
      bgColor: randColor(),
      usePalette: this._config.usePalette ? 1 : 0,
      logi,
      logf,
    };

    // this._wasmInitInput = wasmInput;
    this._wasmModules = await loadWasmModules(wasmInput);
  }

  run(): void {
    console.log(`Worker ${this._config.workerIdx} running!`);

    try {
      this._wasmModules.engineWorker.run();
    } catch (e) {
      console.log(e);
      // TODO post msg ?
    }
  }
}

let worker: EngineWorker;

const commands = {
  async init(config: WorkerConfig): Promise<void> {
    worker = new EngineWorker();
    const initData = await worker.init(config);
    postMessage(initData);
  },
  async initWasm(config: WorkerWasmMemConfig): Promise<void> {
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

export {
  EngineWorker,
  WorkerConfig,
  WorkerWasmMemConfig,
  WorkerInitData,
  WorkerInitImagesData,
  WasmMemViews,
};
