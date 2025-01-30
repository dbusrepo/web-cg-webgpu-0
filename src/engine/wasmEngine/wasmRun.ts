// import assert from 'assert';
import { type WasmMemRegionsData, MemRegionsEnum } from './wasmMemUtils';
import type { WasmViews } from './wasmViews';
import type { WasmModules, WasmImports } from './wasmLoader';
import { loadWasmModules } from './wasmLoader';
import { BPP_RGBA } from '../assets/images/bitImageRgba';
// import { randColor, sleep } from '../utils';
// import { BitImageRGBA } from './assets/images/bitImageRGBA';
// import { PngDecoderRGBA } from './assets/images/vivaxy-png/PngDecoderRGBA';
import {
  FONT_X_SIZE,
  FONT_Y_SIZE,
  FONT_SPACING,
} from '../../../assets/fonts/font';

interface WasmRunParams {
  // usePalette: boolean;
  wasmMem: WebAssembly.Memory;
  wasmMemRegionsSizes: WasmMemRegionsData;
  wasmMemRegionsOffsets: WasmMemRegionsData;
  wasmWorkerHeapSize: number;
  mainWorkerIdx: number;
  workerIdx: number;
  numWorkers: number;
  numTextures: number;
  surface0sizes: [number, number];
  surface1sizes: [number, number];
  frameColorRGBAPtr: number;
  texturesPtr: number;
  mipmapsPtr: number;
}

// eslint-disable-next-line import/no-mutable-exports
let gWasmRun: WasmRun;
// eslint-disable-next-line import/no-mutable-exports
let gWasmView: DataView;
// eslint-disable-next-line import/no-mutable-exports
let gWasmViews: WasmViews;

class WasmRun {
  protected params: WasmRunParams;
  protected wasmModules: WasmModules;
  protected wasmViews: WasmViews;

  public async init(
    params: WasmRunParams,
    wasmViews: WasmViews,
  ): Promise<void> {
    this.params = params;
    this.wasmViews = wasmViews;
    await this.loadWasmModules();
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    gWasmRun = this;
    gWasmView = this.wasmViews.view;
    gWasmViews = this.wasmViews;
  }

  private buildWasmImports(): WasmImports {
    const {
      wasmMem: memory,
      wasmMemRegionsSizes: memSizes,
      wasmMemRegionsOffsets: memOffsets,
      wasmWorkerHeapSize: workerHeapSize,
      surface0sizes,
      // surface1sizes,
      mainWorkerIdx,
      numWorkers,
      numTextures,
      workerIdx,
      frameColorRGBAPtr,
      texturesPtr,
      mipmapsPtr,
    } = this.params;

    const logf = (f: number): void =>
      console.log(`[wasm] Worker [${workerIdx}]: ${f}`);

    const logi = (i: number): void => {
      console.log(`[wasm] Worker [${workerIdx}]: ${i}`);
    };

    const wasmImports: WasmImports = {
      memory,

      rgbaSurface0ptr: memOffsets[MemRegionsEnum.RGBA_SURFACE_0],
      rgbaSurface0width: surface0sizes[0],
      rgbaSurface0height: surface0sizes[1],

      // rgbaSurface1ptr: memOffsets[WasmUtils.MemRegionsEnum.RGBA_SURFACE_1],
      // rgbaSurface1width: surface1sizes[0],
      // rgbaSurface1height: surface1sizes[1],

      syncArrayPtr: memOffsets[MemRegionsEnum.SYNC_ARRAY],
      sleepArrayPtr: memOffsets[MemRegionsEnum.SLEEP_ARRAY],
      mainWorkerIdx,
      workerIdx,
      numWorkers,
      workersHeapPtr: memOffsets[MemRegionsEnum.WORKERS_HEAPS],
      workerHeapSize,
      sharedHeapPtr: memOffsets[MemRegionsEnum.HEAP],
      // usePalette: this._config.usePalette ? 1 : 0,
      // usePalette: 0,
      fontCharsPtr: memOffsets[MemRegionsEnum.FONT_CHARS],
      fontCharsSize: memSizes[MemRegionsEnum.FONT_CHARS],
      numTextures,
      texturesIndexPtr: memOffsets[MemRegionsEnum.TEXTURES_INDEX],
      texturesIndexSize: memSizes[MemRegionsEnum.TEXTURES_INDEX],
      texelsPtr: memOffsets[MemRegionsEnum.TEXTURES],
      texelsSize: memSizes[MemRegionsEnum.TEXTURES],
      stringsDataPtr: memOffsets[MemRegionsEnum.STRINGS],
      stringsDataSize: memSizes[MemRegionsEnum.STRINGS],
      workersMemCountersPtr: memOffsets[MemRegionsEnum.MEM_COUNTERS],
      workersMemCountersSize: memSizes[MemRegionsEnum.MEM_COUNTERS],
      hrTimerPtr: memOffsets[MemRegionsEnum.HR_TIMER],

      FONT_X_SIZE,
      FONT_Y_SIZE,
      FONT_SPACING,

      logi,
      logf,

      frameColorRGBAPtr,
      texturesPtr,
      mipmapsPtr,
    };

    return wasmImports;
  }

  private async loadWasmModules(): Promise<void> {
    const wasmImports = this.buildWasmImports();
    this.wasmModules = await loadWasmModules(wasmImports);
  }

  get FrameWidth(): number {
    return this.params.surface0sizes[0];
  }

  get FrameHeight(): number {
    return this.params.surface0sizes[1];
  }

  get FrameStride(): number {
    return this.FrameWidth;
  }

  get FrameStrideBytes(): number {
    return this.FrameWidth * BPP_RGBA;
  }

  get WasmViews(): WasmViews {
    return this.wasmViews;
  }

  get WasmModules(): WasmModules {
    return this.wasmModules;
  }

  get WasmMem(): WebAssembly.Memory {
    return this.params.wasmMem;
  }
}

export type { WasmRunParams };
export { WasmRun, gWasmRun, gWasmView, gWasmViews };
