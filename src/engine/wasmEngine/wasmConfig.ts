import * as WasmUtils from './wasmMemUtils';

type WasmConfig = {
  wasmMem: WebAssembly.Memory;
  wasmMemRegionsOffsets: WasmUtils.MemRegionsData;
  wasmMemRegionsSizes: WasmUtils.MemRegionsData;
  wasmWorkerHeapSize: number;
  wasmNumImages: number;
};

export { WasmConfig };
