import assert from 'assert';
import * as WasmUtils from './wasmMemUtils';
import { WasmExecutor, WasmExecConfig } from './wasmExecutor';
import { FONT_Y_SIZE, fontChars } from '../assets/fonts/font';
import { stringsArrayData } from '../assets/strings/strings';
import { BitImage } from './assets/images/bitImage';
import {
  BPP_PAL,
  BPP_RGBA,
  PAL_ENTRY_SIZE,
  PALETTE_SIZE,
  PAGE_SIZE_BYTES,
} from '../common';
import { mainConfig } from '../config/mainConfig';
import { WasmConfig } from './wasmConfig';

type WasmViews = WasmUtils.views.WasmViews;

type WasmEngineConfig = {
  numWorkers: number;
  canvas: OffscreenCanvas;
  imagesTotalSize: number;
  images: BitImage[];
};

class WasmEngine {
  private _cfg: WasmEngineConfig;
  private _wasmMem: WebAssembly.Memory;
  private _wasmMemConfig: WasmUtils.MemConfig;
  private _wasmRegionsSizes: WasmUtils.MemRegionsData;
  private _wasmRegionsOffsets: WasmUtils.MemRegionsData;
  private _wasmExecutor: WasmExecutor;
  private _wasmViews: WasmViews;

  public async init(cfg: WasmEngineConfig) {
    this._cfg = cfg;
    await this._initWasm();
    await this._initWasmExecutor();
  }

  private async _initWasm(): Promise<void> {
    this._initWasmMemConfig();
    this._allocWasmMem();
    await this._initWasmExecutor();
    this._initWasmAssets();
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
    const { numWorkers } = this._cfg;
    const stringsRegionSize = stringsArrayData.length;

    // set wasm mem regions sizes
    const wasmMemConfig: WasmUtils.MemConfig = {
      startOffset,
      frameBufferRGBASize: numPixels * BPP_RGBA,
      frameBufferPalSize: 0, // this._cfg.usePalette ? numPixels : 0,
      // eslint-disable-next-line max-len
      paletteSize: 0, // this._cfg.usePalette ? PALETTE_SIZE * PAL_ENTRY_SIZE : 0,
      syncArraySize: (numWorkers + 1) * Int32Array.BYTES_PER_ELEMENT,
      sleepArraySize: (numWorkers + 1) * Int32Array.BYTES_PER_ELEMENT,
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

  private async _initWasmExecutor() {
    this._wasmExecutor = new WasmExecutor();
    const wasmExecCfg: WasmExecConfig = {
      workerIdx: 0, // TODO
      numWorkers: 1, // TODO
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
    this._wasmExecutor.init(wasmExecCfg, wasmCfg);
    this._wasmViews = this._wasmExecutor.wasmViews;
  }
}

export { WasmEngine, WasmEngineConfig };
