import assert from 'assert';
import { fileTypeFromBuffer } from 'file-type';
import * as WasmMemUtils from './wasmMemUtils';
import { WasmModules, WasmInput, loadWasmModules } from './initWasm';
import { syncStore, randColor } from './utils';
import * as loadUtils from './loadUtils';
import { BitImage } from './assets/images/bitImage';
import { BitImage24 } from './assets/images/bitImage24';

import { PngDecoder24 } from './assets/images/vivaxy-png/PngDecoder24';

// const ASSETS_PATH = '../asset';
// const IMAGES_PATH = `${ASSETS_PATH}/images`;

// import myImgUrl from '../asset/images/samplePNGImage.png';

type WorkerConfig = {
  workerIdx: number;
  numWorkers: number;
  frameWidth: number;
  frameHeight: number;
  imageUrls: string[];
};

type WorkerInitData = {
  imagesSize: number;
};

type WorkerWasmMemConfig = {
  wasmMem: WebAssembly.Memory;
  wasmMemStartOffset: number;
  wasmMemStartSize: number;
  wasmMemRegionsOffsets: WasmMemUtils.MemRegionsData;
  wasmMemRegionsSizes: WasmMemUtils.MemRegionsData;
  wasmWorkerHeapSize: number;
};

type AssetsBuffers = {
  images: ArrayBuffer[];
};

class EngineWorker {
  private _config: WorkerConfig;
  private _wasmMemConfig: WorkerWasmMemConfig;
  private _images: BitImage[];

  private _wasmInitInput: WasmInput;
  private _wasmModules: WasmModules;
  private _wasmMemUI8: Uint8Array;
  private _wasmRgbaFramebuffer: Uint8ClampedArray;
  private _wasmSyncArr: Int32Array;
  private _wasmSleepArr: Int32Array;

  public async init(config: WorkerConfig): Promise<WorkerInitData> {
    this._config = config;
    // load png as arraybuffer
    // const imgUrl = (await import('../asset/images/samplePNGImage.png')).default;
    // const imgBuffer = await loadUtils.loadResAsArrayBuffer(imgUrl);
    // const pngDecoder = new PngDecoder24();
    // const [w, h] = pngDecoder.readSize(imgBuffer);
    // console.log(w, h);
    const assetsBuffers = await this._loadAssets();
    return { imagesSize: await this._getImagesTotalSize(assetsBuffers.images) };
  }

  private async _getImagesTotalSize(
    imageBuffers: ArrayBuffer[],
  ): Promise<number> {
    const pngDecoder = new PngDecoder24();
    let size = 0;
    imageBuffers.forEach((imgBuffer) => {
      const [w, h] = pngDecoder.readSizes(imgBuffer);
      size += w * h;
    });
    return size;
  }

  private async _loadImageBuffers(): Promise<ArrayBuffer[]> {
    let size = 0;
    const imageBuffers = await Promise.all(
      this._config.imageUrls.map(async (url) =>
        loadUtils.loadResAsArrayBuffer(url),
      ),
    );
    return imageBuffers;
  }

  private async _loadAssets(): Promise<AssetsBuffers> {
    const imageBuffers = await this._loadImageBuffers();
    await this._loadImages(imageBuffers);
    return {
      images: imageBuffers,
    };
  }

  private async _loadImages(imageBuffers: ArrayBuffer[]): Promise<void> {
    this._images = await Promise.all(
      imageBuffers.map(async (imgBuffer) => this._loadImage(imgBuffer)),
    );
  }

  private async _loadImage(imageBuffer: ArrayBuffer): Promise<BitImage> {
    const fileType = await fileTypeFromBuffer(imageBuffer);
    if (!fileType) {
      throw new Error(`_loadImage: file type not found`);
    }
    switch (fileType.ext) {
      case 'png': {
        const pngDecoder = new PngDecoder24();
        const bitImage = new BitImage24();
        pngDecoder.read(imageBuffer, bitImage);
        return bitImage;
      }
      // break;
      default:
        throw new Error(`_loadImage does not support ${fileType.ext} loading`);
    }
  }

  public async initWasm(config: WorkerWasmMemConfig): Promise<void> {
    this._wasmMemConfig = config;
    this._initWasmMemViews();
    this._initWasmImages();
    await this.initWasmModules();
  }

  private _initWasmImages() {}

  private _initWasmMemViews(): void {
    const {
      wasmMem,
      wasmMemStartOffset,
      wasmMemStartSize,
      wasmMemRegionsOffsets: memOffsets,
      wasmMemRegionsSizes: memSizes,
    } = this._wasmMemConfig;

    const { workerIdx } = this._config;

    const wasmMemSize = wasmMemStartOffset + wasmMemStartSize;
    this._wasmMemUI8 = new Uint8Array(wasmMem.buffer, 0, wasmMemSize);

    const rgbaFrameBufferRegion = WasmMemUtils.MemRegions.RGBA_FRAMEBUFFER;
    this._wasmRgbaFramebuffer = new Uint8ClampedArray(
      wasmMem.buffer,
      memOffsets[rgbaFrameBufferRegion],
      memSizes[rgbaFrameBufferRegion],
    );

    const syncArrayRegion = WasmMemUtils.MemRegions.SYNC_ARRAY;
    this._wasmSyncArr = new Int32Array(
      wasmMem.buffer,
      memOffsets[syncArrayRegion],
      memSizes[syncArrayRegion] / Int32Array.BYTES_PER_ELEMENT,
    );
    syncStore(this._wasmSyncArr, workerIdx, 0);

    const sleepArrayRegion = WasmMemUtils.MemRegions.SLEEP_ARRAY;
    this._wasmSleepArr = new Int32Array(
      wasmMem.buffer,
      memOffsets[sleepArrayRegion],
      memSizes[sleepArrayRegion] / Int32Array.BYTES_PER_ELEMENT,
    );
    syncStore(this._wasmSleepArr, workerIdx, 0);
  }

  private async initWasmModules(): Promise<void> {
    const {
      wasmMem: memory,
      wasmMemRegionsOffsets: memOffsets,
      wasmWorkerHeapSize: workerHeapSize,
    } = this._wasmMemConfig;

    const { frameWidth, frameHeight, numWorkers, workerIdx } = this._config;

    const wasmInput: WasmInput = {
      memory,
      frameWidth,
      frameHeight,
      frameBufferOffset: memOffsets[WasmMemUtils.MemRegions.RGBA_FRAMEBUFFER],
      syncArrayOffset: memOffsets[WasmMemUtils.MemRegions.SYNC_ARRAY],
      sleepArrayOffset: memOffsets[WasmMemUtils.MemRegions.SLEEP_ARRAY],
      workerIdx,
      numWorkers,
      workersHeapOffset: memOffsets[WasmMemUtils.MemRegions.WORKERS_HEAPS],
      workerHeapSize,
      heapOffset: memOffsets[WasmMemUtils.MemRegions.HEAP],
      bgColor: randColor(),
      logf: (f: number) => console.log(`Worker [${workerIdx}]: ${f}`),
      logi: (i: number) => console.log(`Worker [${workerIdx}]: ${i}`),
    };

    this._wasmInitInput = wasmInput;
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
    await worker.initWasm(config);
    postMessage('ready');
  },
  run(): void {
    worker.run();
  },
};

// ENTRY POINT
self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

export { EngineWorker, WorkerConfig, WorkerWasmMemConfig, WorkerInitData };
