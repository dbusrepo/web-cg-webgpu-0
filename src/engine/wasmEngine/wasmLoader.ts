// import assert from 'assert';
// import engineWasm from './wasm/build/asc/engine.wasm';
import engineWasmInit from './wasm/build/asc/engine.wasm?init';
import engineExport from './wasm/build/asc/engine';

// TODO
// type wasmInit<T> = (imports?: WebAssembly.Imports) => Promise<{ instance: WebAssembly.Instance & { exports: T } }>;
// type wasmInit<T> = (imports?: WebAssembly.Imports) => Promise<{ instance: WebAssembly.Instance & { exports: T } }>;

// ****** WASM IMPORT (wasm built from wat)
// import clear_canvas_wasm from './wasm/build/wat/clear_canvas.wasm';
// import clear_test_wasm from './wasm/bin/clear_test.wasm';

type WasmImports = {
  memory: WebAssembly.Memory;
  syncArrayPtr: number;
  sleepArrayPtr: number;
  workersHeapPtr: number;
  workerHeapSize: number;
  sharedHeapPtr: number;
  workerIdx: number;
  mainWorkerIdx: number;
  numWorkers: number;
  workersMemCountersPtr: number;
  workersMemCountersSize: number;
  hrTimerPtr: number;

  logi: (v: number) => void;
  logf: (v: number) => void;
};

type WasmModules = {
  engine: typeof engineExport;
};

type WasmEngineModule = WasmModules['engine'];

// type wasmInit<T> = (imports?: WebAssembly.Imports) => Promise<{ instance: WebAssembly.Instance & { exports: T } }>;
//
// async function loadWasm<T>(wasmInit: wasmInit<T>, wasmImports: WasmImports): Promise<T> {
//   const imports = {
//     // import in asc file with the same name: importVars.ts, importImages.ts, ...
//     importVars: {
//       ...wasmImports,
//     },
//     env: {
//       memory: wasmImports.memory,
//       abort: (..._args: any[]) => {
//         console.log('abort!');
//       },
//       'performance.now': () => performance.now(),
//     },
//   };
//   const { instance } = await wasmInit(imports);
//   return instance.exports as T;
// }

async function loadWasmModules(wasmImports: WasmImports): Promise<WasmModules> {
  // engineWasmInit().then((instance) => {
  // // const engine = await loadWasm<typeof engineExport>(engineWasm, imports);
  //   // instance.exports.test();
  // });

  // const engineWasmModule = await loadWasm<typeof engineExport>(
  //   ff,
  //   imports
  // );

  //
  // if (engineWasmModule.init) {
  //   engineWasmModule.init();
  // }
  //
  // return {
  //   engine: engineWasmModule,
  // };

  // return {} as WasmModules;

  const imports = {
    importVars: {
      ...wasmImports,
    },
    env: {
      memory: wasmImports.memory,
      abort: (..._args: any[]) => {
        console.log('abort!');
      },
      'performance.now': () => performance.now(),
    },
  };

  const { exports: engineWasmExports } = (await engineWasmInit(imports)) as unknown as { exports: WasmEngineModule };

  if (engineWasmExports.init) {
    const res = engineWasmExports.init();
    console.log('res: ', res);
  }

  return {
    engine: engineWasmExports as WasmEngineModule,
  };
}


export type { WasmImports, WasmModules, WasmEngineModule };
export { loadWasmModules };
