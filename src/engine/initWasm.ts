// import assert from 'assert';

// ASC modules here
import drawWasm from './wasm/build/asc/draw.wasm';
import drawExport from './wasm/build/asc/draw';
import engineWorkerWasm from './wasm/build/asc/engineWorker.wasm';
import engineWorkerExport from './wasm/build/asc/engineWorker';

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
  workerIdx: number;
  log_i32: (v: number) => void;
}

interface WasmModules {
  engineWorker: typeof engineWorkerExport;
}

async function loadWasm<T>(
  name: string,
  wasm: wasmBuilderFunc<T>,
  wasmInit: WasmInput,
  imports: object = {},
): Promise<T> {
  const instance = await wasm({
    [name]: {
      ...wasmInit,
      ...imports,
    },
    env: {
      memory: wasmInit.memory,
      abort: () => {
        console.log('abort!');
      },
    },
  });
  return instance.instance.exports;
}

async function loadEngineWorkerExports(
  wasmInit: WasmInput,
): Promise<typeof engineWorkerExport> {
  const drawExports = await loadWasm<typeof drawExport>('draw', drawWasm, wasmInit);
  const instance = await loadWasm<typeof engineWorkerExport>(
    'engineWorker',
    engineWorkerWasm,
    wasmInit,
    drawExports,
  );
  return instance;
}

async function loadWasmModules(wasmInit: WasmInput): Promise<WasmModules> {
  const engineWorker = await loadEngineWorkerExports(wasmInit);
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
