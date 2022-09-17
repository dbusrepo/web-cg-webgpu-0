// import assert from 'assert';

import engineWorkerWasm from './wasm/build/asc/engineWorker.wasm';
import engineWorkerExport from './wasm/build/asc/engineWorker';

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
  frameBufferOffset: number;
  syncArrayOffset: number;
  sleepArrayOffset: number;
  workersHeapOffset: number;
  workerHeapSize: number;
  heapOffset: number;
  workerIdx: number;
  numWorkers: number;
  logi: (v: number) => void;
  logf: (v: number) => void;
  bgColor: number;
  imagesIndexOffset: number;
  numImages: number;
  usePalette: number;
}

interface WasmModules {
  engineWorker: typeof engineWorkerExport;
}

async function loadWasm<T>(
  name: string,
  wasm: wasmBuilderFunc<T>,
  wasmInit: WasmInput,
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
    // [name]: {
    importVars: {
      ...wasmInit,
      ...otherImpObj,
    },
    env: {
      memory: wasmInit.memory,
      abort: (...args: any[]) => {
        console.log('abort!');
      },
      'performance.now': () => performance.now(),
    },
  });
  return instance.instance.exports;
}

async function loadEngineWorkerExport(
  wasmInit: WasmInput,
): Promise<typeof engineWorkerExport> {
  const engineWorker = await loadWasm<typeof engineWorkerExport>(
    'engineWorker',
    engineWorkerWasm,
    wasmInit,
  );
  return engineWorker;
}

async function loadWasmModules(wasmInit: WasmInput): Promise<WasmModules> {
  const engineWorker = await loadEngineWorkerExport(wasmInit);
  // if (wasmInit.workerIdx === 0) {}
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
