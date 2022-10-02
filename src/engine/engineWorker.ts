import assert from 'assert';
import { fileTypeFromBuffer } from 'file-type';
import * as WasmMemUtils from './wasmMemUtils';
import { WasmModules, WasmInput, loadWasmModules } from './initWasm';
import { syncStore, randColor, sleep } from './utils';
import * as loadUtils from './loadUtils';
import { BitImage } from './assets/images/bitImage';
import { BitImageRGBA } from './assets/images/bitImageRGBA';
import { PngDecoderRGBA } from './assets/images/vivaxy-png/PngDecoderRGBA';
import { getImagesInitData } from './assets/images/utils';

type WorkerConfig = {
  workerIdx: number;
  numWorkers: number;
  frameWidth: number;
  frameHeight: number;
  imageUrls: string[];
  usePalette: boolean;
};

type WorkerInitImagesData = {
  totalImagesSize: number; // in bytes
  imagesSizes: [number, number][];
};

type WorkerInitData = WorkerInitImagesData; // {} & WorkerInitImagesData;

type WorkerWasmMemConfig = {
  wasmMem: WebAssembly.Memory;
  wasmMemStartOffset: number;
  wasmMemStartSize: number;
  wasmMemRegionsOffsets: WasmMemUtils.MemRegionsData;
  wasmMemRegionsSizes: WasmMemUtils.MemRegionsData;
  wasmWorkerHeapSize: number;
  wasmNumImages: number;
  wasmImagesIndexOffset: number; // images region starts here
  wasmWorkerImagesOffsets: number[]; // for each worker gives the offsets of its images
  wasmWorkerImagesSize: number[]; // for each worker gives the total size of its images
  wasmImagesSizes: [number, number][]; // for each image gives its sizes [w, h]
  wasmImagesOffsets: number[]; // for each image gives its offsets wrt the start of the images region (so it consider the index area)
};

type AssetsBuffers = {
  images: ArrayBuffer[];
};

class WasmMemViews {
  memUI8: Uint8Array;
  frameBufferRGBA: Uint8ClampedArray;
  syncArr: Int32Array;
  sleepArr: Int32Array;
  imagesIndex: Uint32Array;
  imagesPixels: Uint8Array;

  constructor(
    wasmMem: WebAssembly.Memory,
    wasmMemStartOffset: number,
    wasmMemStartSize: number,
    memOffsets: WasmMemUtils.MemRegionsData,
    memSizes: WasmMemUtils.MemRegionsData,
    numImages: number,
    workerIdx: number,
  ) {
    const wasmMemSize = wasmMemStartOffset + wasmMemStartSize;
    this.memUI8 = new Uint8Array(wasmMem.buffer, 0, wasmMemSize);

    this.frameBufferRGBA = new Uint8ClampedArray(
      wasmMem.buffer,
      memOffsets[WasmMemUtils.MemRegions.FRAMEBUFFER_RGBA],
      memSizes[WasmMemUtils.MemRegions.FRAMEBUFFER_RGBA],
    );

    this.syncArr = new Int32Array(
      wasmMem.buffer,
      memOffsets[WasmMemUtils.MemRegions.SYNC_ARRAY],
      memSizes[WasmMemUtils.MemRegions.SYNC_ARRAY] /
        Int32Array.BYTES_PER_ELEMENT,
    );
    syncStore(this.syncArr, workerIdx, 0);

    this.sleepArr = new Int32Array(
      wasmMem.buffer,
      memOffsets[WasmMemUtils.MemRegions.SLEEP_ARRAY],
      memSizes[WasmMemUtils.MemRegions.SLEEP_ARRAY] /
        Int32Array.BYTES_PER_ELEMENT,
    );
    syncStore(this.sleepArr, workerIdx, 0);

    // Assets mem views

    // images data views
    const imagesIndexSize =
      WasmMemUtils.initImages.getImageIndexSizeBytes(numImages);

    this.imagesIndex = new Uint32Array(
      wasmMem.buffer,
      memOffsets[WasmMemUtils.MemRegions.IMAGES],
      imagesIndexSize / Uint32Array.BYTES_PER_ELEMENT,
    );

    this.imagesPixels = new Uint8Array(
      wasmMem.buffer,
      memOffsets[WasmMemUtils.MemRegions.IMAGES] + imagesIndexSize,
      memSizes[WasmMemUtils.MemRegions.IMAGES] - imagesIndexSize,
    );
  }
};


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

  // private _getBPP(): number {
  //   const bpp = this._config.usePalette ? 1 : 4;
  //   return bpp;
  // }

  public async init(config: WorkerConfig): Promise<WorkerInitData> {
    this._config = config;
    await this._initAssetsBuffers();
    return { ...(await this._getImagesInitData()) };
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

  private async _getImagesInitData(): Promise<WorkerInitImagesData> {
    const imgsInfos = await getImagesInitData(this._assetBuffers.images);
    // TODO note use getBPP as required by the engine, then when loading the
    // images data 
    const totalImagesSize = imgsInfos.reduce(
      (size, imgInfo) => size + imgInfo.bpp * imgInfo.width * imgInfo.height,
      0,
    );
    const imagesSizes = imgsInfos.map(
      (imgInfo) => [imgInfo.width, imgInfo.height] as [number, number],
    );
    return { totalImagesSize, imagesSizes };
  }

  private async _loadImage(imageBuffer: ArrayBuffer): Promise<BitImage> {
    // TODO check use palette ?
    const fileType = await fileTypeFromBuffer(imageBuffer);
    if (!fileType) {
      throw new Error(`_loadImage: file type not found`);
    }
    switch (fileType.ext) {
      case 'png': {
        const bitImage = new BitImageRGBA();
        new PngDecoderRGBA().read(imageBuffer, bitImage);
        return bitImage;
      }
      // break;
      default:
        throw new Error(`_loadImage does not support ${fileType.ext} loading`);
    }
  }

  async loadAssets() {
    await this._loadImages();
  }

  private async _loadImages() {
    this._images = await Promise.all(
      this._assetBuffers.images.map(async (imgBuffer) => this._loadImage(imgBuffer)),
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

    this._wasmMemViews = new WasmMemViews(
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
      WasmMemUtils.initImages.writeImageIndex(
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
      frameBufferOffset: memOffsets[WasmMemUtils.MemRegions.FRAMEBUFFER_RGBA],
      syncArrayOffset: memOffsets[WasmMemUtils.MemRegions.SYNC_ARRAY],
      sleepArrayOffset: memOffsets[WasmMemUtils.MemRegions.SLEEP_ARRAY],
      imagesIndexOffset: memOffsets[WasmMemUtils.MemRegions.IMAGES],
      numImages: this._wasmMemConfig.wasmImagesSizes.length,
      workerIdx,
      numWorkers,
      workersHeapOffset: memOffsets[WasmMemUtils.MemRegions.WORKERS_HEAPS],
      workerHeapSize,
      heapOffset: memOffsets[WasmMemUtils.MemRegions.HEAP],
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
