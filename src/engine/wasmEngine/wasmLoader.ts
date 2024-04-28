// import assert from 'assert';
import engineWasm from './wasm/build/asc/engine.wasm';
import engineExport from './wasm/build/asc/engine';

// TODO
type wasmBuilderFunc<T> = (
  importsObject?: WebAssembly.Imports,
) => Promise<{ instance: WebAssembly.Instance & { exports: T } }>;

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

async function loadWasm<T>(
  wasm: wasmBuilderFunc<T>,
  wasmInput: WasmImports,
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

async function loadWasmModules(imports: WasmImports): Promise<WasmModules> {
  const engine = await loadWasm<typeof engineExport>(engineWasm, imports);
  engine.init();
  return {
    engine,
  };
}

export type { WasmImports, WasmModules, WasmEngineModule };
export { loadWasmModules };
