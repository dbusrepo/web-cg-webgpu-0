// import assert from 'assert';

import engineWorkerWasm from './wasm/build/asc/engineWorker.wasm';
import engineWorkerExport from './wasm/build/asc/engineWorker';
import { ascImportImages } from '../assets/images/imagesList';
import { ascImportStrings } from '../assets/strings/strings';

// TODO
type wasmBuilderFunc<T> = (
  importsObject?: WebAssembly.Imports,
) => Promise<{ instance: WebAssembly.Instance & { exports: T } }>;

// ****** WASM IMPORT (wasm built from wat)
// import clear_canvas_wasm from './wasm/build/wat/clear_canvas.wasm';
// import clear_test_wasm from './wasm/bin/clear_test.wasm';

interface WasmInput {
  memory: WebAssembly.Memory;
  frameWidth: number;
  frameHeight: number;
  frameBufferPtr: number;
  syncArrayPtr: number;
  sleepArrayPtr: number;
  workersHeapPtr: number;
  workerHeapSize: number;
  heapPtr: number;
  workerIdx: number;
  numWorkers: number;
  bgColor: number;
  usePalette: number;
  numImages: number;
  imagesIndexPtr: number;
  imagesIndexSize: number;
  imagesDataPtr: number;
  imagesDataSize: number;
  fontCharsPtr: number;
  fontCharsSize: number;
  stringsDataPtr: number;
  stringsDataSize: number;
  workersMemCountersPtr: number;
  workersMemCountersSize: number;
  inputKeysPtr: number;
  inputKeysSize: number;

  FONT_X_SIZE: number;
  FONT_Y_SIZE: number;
  FONT_SPACING: number;

  logi: (v: number) => void;
  logf: (v: number) => void;
}

interface WasmModules {
  engineWorker: typeof engineWorkerExport;
}

async function loadWasm<T>(
  wasm: wasmBuilderFunc<T>,
  wasmInput: WasmInput,
  ...otherImports: object[]
): Promise<T> {
  const otherImpObj = otherImports.reduce(
    (acc, obj) => ({
      ...acc,
      ...obj,
    }),
    {},
  );
  const instance = await wasm({
    // for each of these obj props import their fields from asc file with the
    // same name: importVars.ts, importImages.ts, ...
    importVars: {
      ...wasmInput,
      ...otherImpObj,
    },
    importImages: {
      ...ascImportImages,
    },
    importStrings: {
      ...ascImportStrings,
    },
    env: {
      memory: wasmInput.memory,
      abort: (...args: any[]) => {
        console.log('abort!');
      },
      'performance.now': () => performance.now(),
    },
  });
  return instance.instance.exports;
}

async function loadEngineWorkerWasm(
  wasmInit: WasmInput,
): Promise<typeof engineWorkerExport> {
  const engineWorker = await loadWasm<typeof engineWorkerExport>(
    engineWorkerWasm,
    wasmInit,
  );
  return engineWorker;
}

async function loadWasmModules(wasmImports: WasmInput): Promise<WasmModules> {
  const engineWorker = await loadEngineWorkerWasm(wasmImports);
  // if (wasmInit.workerIdx === 0) {}
  // pre exec init (shared heap, ds, ...)
  engineWorker.init();
  return {
    engineWorker,
  };
}

export {
  WasmInput,
  WasmModules, // output w
  loadWasmModules,
};

// const log = (msgNum: number, strIdx: number) => {
// console.log('str idx is ' + strIdx);
// const lenIdx = strIdx - 4;
// const len = new Uint32Array(this._memory.buffer, lenIdx, 4)[0];
// console.log('Lenght is ' + len);
// const strBytesSrc = new Uint16Array(this._memory.buffer, strIdx, len);
// const strBytes = strBytesSrc.slice();
// const str = new TextDecoder('utf-16').decode(strBytes);
// console.log('The string is ' + str);
// const msg = clearCanvasModule.instance.exports.__getString(msgIdx);
// console.log(`Message: ${msgNum} ${msg}`);
// };

// const importObject = {
//   env: {
//     buffer: memory,
//     canvas_width: w, // TODO fix names?
//     canvas_height: h,
//     pixkl_count,
//     log: (msgIdx: number, msg: string) => {
//       console.log(`Message: ${msgIdx} ${msg}`)
//     }
//   },
// };
