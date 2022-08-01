// import assert from 'assert';
import { AscModules, loadAscModules } from './initAscWasm';

// ****** WASM IMPORT (wasm built from wat)
// import clear_canvas_wasm from './wasm/build/wat/clear_canvas.wasm';
// import clear_test_wasm from './wasm/bin/clear_test.wasm';

interface WasmInput {
  memory: WebAssembly.Memory;
  frameWidth: number;
  frameHeight: number;
  frameBufferOffset: number;
  frameBufferSize: number;
}

interface WasmModules {
  asc: AscModules;
}

async function loadWasmModules(wasmInit: WasmInput): Promise<WasmModules> {
  const ascModules = await loadAscModules(wasmInit);

  return {
    asc: ascModules,
  };
}

export {
  WasmInput,
  WasmModules, // output w
  loadWasmModules,
};
