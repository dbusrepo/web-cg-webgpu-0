// import assert from 'assert';
import type engineExport from './wasm/build/asc/engine';
// eslint-disable-next-line import/no-unresolved
import engineWasmInit from './wasm/build/asc/engine.wasm?init';

// ****** WASM IMPORT (wasm built from wat)
// import clear_canvas_wasm from './wasm/build/wat/clear_canvas.wasm';
// import clear_test_wasm from './wasm/bin/clear_test.wasm';

interface WasmImports {
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
