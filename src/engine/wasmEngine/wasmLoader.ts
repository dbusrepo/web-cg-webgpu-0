// import assert from 'assert';
import type engineExport from './wasm/build/asc/engine';
// eslint-disable-next-line import/no-unresolved
import engineWasmInit from './wasm/build/asc/engine.wasm?init';
import { ascImportImages } from '../../../assets/build/images';
import { ascImportStrings } from '../../../assets/build/strings';
import {
  wasmTexturesIndexFieldSizes,
  wasmTexturesIndexFieldOffsets,
} from './wasmMemInitImages';

// ****** WASM IMPORT (wasm built from wat)
// import clear_canvas_wasm from './wasm/build/wat/clear_canvas.wasm';
// import clear_test_wasm from './wasm/bin/clear_test.wasm';

interface WasmImports {
  memory: WebAssembly.Memory;
  rgbaSurface0ptr: number;
  rgbaSurface0width: number;
  rgbaSurface0height: number;
  // rgbaSurface1ptr: number;
  // rgbaSurface1width: number;
  // rgbaSurface1height: number;
  syncArrayPtr: number;
  sleepArrayPtr: number;
  workersHeapPtr: number;
  workerHeapSize: number;
  sharedHeapPtr: number;
  workerIdx: number;
  mainWorkerIdx: number;
  numWorkers: number;
  // usePalette: number;
  numTextures: number;
  texturesIndexPtr: number;
  texturesIndexSize: number;
  texelsPtr: number;
  texelsSize: number;
  fontCharsPtr: number;
  fontCharsSize: number;
  stringsDataPtr: number;
  stringsDataSize: number;
  workersMemCountersPtr: number;
  workersMemCountersSize: number;
  hrTimerPtr: number;
  FONT_X_SIZE: number;
  FONT_Y_SIZE: number;
  FONT_SPACING: number;

  logi: (v: number) => void;
  logf: (v: number) => void;

  frameColorRGBAPtr: number;
  texturesPtr: number;
  mipmapsPtr: number;
}

interface WasmModules {
  engine: typeof engineExport;
}

type WasmEngineModule = WasmModules['engine'];

async function loadWasmModules(wasmImports: WasmImports): Promise<WasmModules> {
  const imports = {
    importVars: {
      ...wasmImports,
    },
    importTexturesIndexFieldSizes: {
      ...wasmTexturesIndexFieldSizes,
    },
    importTexturesIndexFieldOffsets: {
      ...wasmTexturesIndexFieldOffsets,
    },
    gen_importImages: {
      ...ascImportImages,
    },
    gen_importStrings: {
      ...ascImportStrings,
    },
    env: {
      memory: wasmImports.memory,
      // abort: (..._args: any[]) => {
      abort: (): void => {
        console.log('abort!');
      },
      'performance.now': (): number => performance.now(),
    },
  };

  const { exports: engineWasmExports } = (await engineWasmInit(
    imports,
  )) as unknown as { exports: WasmEngineModule };

  if (engineWasmExports.init) {
    engineWasmExports.init();
  }

  return {
    engine: engineWasmExports as WasmEngineModule,
  };
}

export type { WasmImports, WasmModules, WasmEngineModule };
export { loadWasmModules };
