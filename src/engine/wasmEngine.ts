import assert from 'assert';
import * as WasmUtils from './wasmMemUtils';
import { WasmRun, WasmRunConfig } from './wasmRun';
import WasmWorkerCommands from './wasmWorkerCommands';
import { WasmWorkerConfig } from './wasmWorker';
import { FONT_Y_SIZE, fontChars } from '../assets/fonts/font';
import { stringsArrayData } from '../assets/strings/strings';
import { BitImage } from './assets/images/bitImage';
import * as utils from './utils';
import {
  // BPP_PAL,
  BPP_RGBA,
  // PAL_ENTRY_SIZE,
  // PALETTE_SIZE,
  PAGE_SIZE_BYTES,
} from '../common';
import { mainConfig } from '../config/mainConfig';
import { WasmConfig } from './wasmConfig';

type WasmViews = WasmUtils.views.WasmViews;

type WasmEngineConfig = {
  numAuxWorkers: number;
  canvas: OffscreenCanvas;
  imagesTotalSize: number;
  images: BitImage[];
};

class WasmEngine {
  private _cfg: WasmEngineConfig;
  private _wasmRunCfg: WasmRunConfig;
  private _wasmCfg: WasmConfig;
  private _wasmMem: WebAssembly.Memory;
  private _wasmMemConfig: WasmUtils.MemConfig;
  private _wasmRegionsSizes: WasmUtils.MemRegionsData;
  private _wasmRegionsOffsets: WasmUtils.MemRegionsData;
  private _wasmViews: WasmViews;
  private _wasmRun: WasmRun;
  private _workers: Worker[]; // TODO mv

  public async init(cfg: WasmEngineConfig) {
    this._cfg = cfg;
    await this._initWasm();
  }

  private async _initWasm(): Promise<void> {
    this._initWasmMemConfig();
    this._allocWasmMem();
    await this._initWasmRun();
    this._initWasmAssets();
    if (this._cfg.numAuxWorkers >= 1) {
      await this._launchWasmWorkers();
    }
  }

  private _allocWasmMem(): void {
    const startSize = this._wasmRegionsSizes[WasmUtils.MemRegions.START_MEM];
    const startOffset =
      this._wasmRegionsOffsets[WasmUtils.MemRegions.START_MEM];
    const wasmMemStartTotalSize = startOffset + startSize;
    const { wasmMemStartPages: initial, wasmMemMaxPages: maximum } = mainConfig;
    assert(initial * PAGE_SIZE_BYTES >= wasmMemStartTotalSize);
    const memory = new WebAssembly.Memory({
      initial,
      maximum,
      shared: true,
    });
    this._wasmMem = memory;
    console.log(
      `wasm mem pages required: ${Math.ceil(
        wasmMemStartTotalSize / PAGE_SIZE_BYTES,
      )}`,
    );
    console.log(`wasm mem start pages: ${initial}`);
  }

  private _initWasmMemConfig(): void {
    const startOffset = mainConfig.wasmMemStartOffset;
    const numPixels = this._cfg.canvas.width * this._cfg.canvas.height;
    const imagesIndexSize = WasmUtils.initImages.getImagesIndexSize();
    const imagesRegionSize = this._cfg.imagesTotalSize;
    const workerHeapPages = mainConfig.wasmWorkerHeapPages;
    const numWorkers = this._getNumWorkers();
    const stringsRegionSize = stringsArrayData.length;

    // set wasm mem regions sizes
    const wasmMemConfig: WasmUtils.MemConfig = {
      startOffset,
      frameBufferRGBASize: numPixels * BPP_RGBA,
      frameBufferPalSize: 0, // this._cfg.usePalette ? numPixels : 0,
      // eslint-disable-next-line max-len
      paletteSize: 0, // this._cfg.usePalette ? PALETTE_SIZE * PAL_ENTRY_SIZE : 0,
      syncArraySize: numWorkers * Int32Array.BYTES_PER_ELEMENT,
      sleepArraySize: numWorkers * Int32Array.BYTES_PER_ELEMENT,
      numWorkers,
      workerHeapSize: PAGE_SIZE_BYTES * workerHeapPages,
      sharedHeapSize: mainConfig.wasmSharedHeapSize,
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
    this._wasmRegionsSizes = sizes;
    this._wasmRegionsOffsets = offsets;

    console.log('SIZES: ', JSON.stringify(this._wasmRegionsSizes));
    console.log('OFFSETS: ', JSON.stringify(this._wasmRegionsOffsets));
    console.log(
      `wasm mem start offset: ${
        this._wasmRegionsOffsets[WasmUtils.MemRegions.START_MEM]
      }`,
    );
    console.log(
      `wasm mem start size: ${
        this._wasmRegionsSizes[WasmUtils.MemRegions.START_MEM]
      }`,
    );
  }

  private _initWasmAssets(): void {
    this._initWasmFontChars();
    this._initWasmStrings();
    this._initWasmImages();
  }

  private _initWasmFontChars() {
    WasmUtils.initFontChars.writeFontCharsData(this._wasmViews.fontChars);
  }

  private _initWasmStrings() {
    WasmUtils.initStrings.writeStringsData(this._wasmViews.strings);
  }

  private _initWasmImages(): void {
    WasmUtils.initImages.writeImages(
      this._cfg.images,
      this._wasmViews.imagesPixels,
      this._wasmViews.imagesIndex,
    );
  }

  private _getNumWorkers(): number {
    return this._cfg.numAuxWorkers + 1; // #auxiliary workers + main
  }

  private async _initWasmRun() {
    this._wasmRun = new WasmRun();
    const wasmRunCfg: WasmRunConfig = {
      workerIdx: 0, // main thread is 0, aux workers starts from 1
      numWorkers: this._getNumWorkers(),
      frameWidth: this._cfg.canvas.width,
      frameHeight: this._cfg.canvas.height,
    };
    const wasmCfg: WasmConfig = {
      wasmMem: this._wasmMem,
      wasmMemRegionsSizes: this._wasmRegionsSizes,
      wasmMemRegionsOffsets: this._wasmRegionsOffsets,
      wasmWorkerHeapSize: mainConfig.wasmWorkerHeapPages * PAGE_SIZE_BYTES,
      wasmNumImages: this._cfg.images.length,
    };
    await this._wasmRun.init(wasmRunCfg, wasmCfg);
    this._wasmViews = this._wasmRun.wasmViews;
    this._wasmRunCfg = wasmRunCfg;
    this._wasmCfg = wasmCfg;
  }

  private async _launchWasmWorkers() {
    console.log('Launching workers...');
    this._workers = [];
    let workerCount = this._cfg.numAuxWorkers;
    const initStart = Date.now();
    try {
      await new Promise<void>((resolve, reject) => {
        for (
          let workerIdx = 1;
          workerIdx <= this._cfg.numAuxWorkers;
          ++workerIdx
        ) {
          const worker = new Worker(
            new URL('./wasmWorker.ts', import.meta.url),
            {
              name: `wasm-worker-${workerIdx}`,
              type: 'module',
            },
          );
          this._workers.push(worker);
          const workerWasmRunConfig: WasmRunConfig = {
            ...this._wasmRunCfg,
            workerIdx,
          };
          const workerConfig: WasmWorkerConfig = {
            wasmRunCfg: workerWasmRunConfig,
            wasmCfg: this._wasmCfg,
          };
          worker.postMessage({
            command: WasmWorkerCommands.INIT,
            params: workerConfig,
          });
          worker.onmessage = ({ data }) => {
            --workerCount;
            console.log(
              `Worker id=${workerIdx} init, left count=${workerCount}, time=${
                Date.now() - initStart
              }ms with data = ${JSON.stringify(data)}`,
            );
            if (workerCount === 0) {
              console.log(
                `Workers init done. After ${Date.now() - initStart}ms`,
              );
              resolve();
            }
          };
          worker.onerror = (error) => {
            console.log(`Worker id=${workerIdx} error: ${error.message}\n`);
            reject(error);
          };
        }
      });
      console.log('Workers initialized. Launching...');
      this._workers.forEach((worker) => {
        worker.postMessage({
          command: WasmWorkerCommands.RUN,
        });
      });
    } catch (error) {
      console.error(`Error during workers init: ${JSON.stringify(error)}`);
    }
  }

  public drawFrame(imageData: ImageData) {
    for (let i = 1; i <= this._cfg.numAuxWorkers; ++i) {
      utils.syncStore(this._wasmRun.wasmViews.syncArr, i, 1);
      utils.syncNotify(this._wasmRun.wasmViews.syncArr, i);
    }
    this._wasmRun.wasmModules.engine.run();
    for (let i = 1; i <= this._cfg.numAuxWorkers; ++i) {
      utils.syncWait(this._wasmRun.wasmViews.syncArr, i, 1);
    }
    imageData.data.set(this._wasmViews.frameBufferRGBA);
  }

  public inputKeyDown(keyIdx: number) {
    this._wasmViews.inputKeys[keyIdx] = 1;
  }

  public inputKeyUp(keyIdx: number) {
    this._wasmViews.inputKeys[keyIdx] = 0;
  }
}

export { WasmEngine, WasmEngineConfig };
