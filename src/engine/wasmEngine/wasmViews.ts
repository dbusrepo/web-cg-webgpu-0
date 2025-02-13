import { MemRegionsEnum, type WasmMemRegionsData } from './wasmMemUtils';

interface WasmViews {
  view: DataView;
  memUI8: Uint8Array;
  memUIC8: Uint8ClampedArray;
  memUI16: Uint16Array;
  memUI32: Uint32Array;
  memI8: Int8Array;
  memI16: Int16Array;
  memI32: Int32Array;
  memF32: Float32Array;
  memF64: Float64Array;
  memBUI64: BigUint64Array;
  memBI64: BigInt64Array;
  syncArr: Int32Array;
  sleepArr: Int32Array;
  workersMemCounters: Uint32Array;
  hrTimer: BigUint64Array;
}

function buildWasmMemViews(
  wasmMem: WebAssembly.Memory,
  memOffsets: WasmMemRegionsData,
  memSizes: WasmMemRegionsData,
): WasmViews {
  // const startSize = memSizes[MemRegionsEnum.START_MEM];
  // const startOffset = memOffsets[MemRegionsEnum.START_MEM];
  // const wasmTotalStartSize = startOffset + startSize;

  const view = new DataView(wasmMem.buffer);
  const memUI8 = new Uint8Array(wasmMem.buffer);
  const memUIC8 = new Uint8ClampedArray(wasmMem.buffer);
  const memUI16 = new Uint16Array(wasmMem.buffer);
  const memUI32 = new Uint32Array(wasmMem.buffer);
  const memI8 = new Int8Array(wasmMem.buffer);
  const memI16 = new Int16Array(wasmMem.buffer);
  const memI32 = new Int32Array(wasmMem.buffer);
  const memF32 = new Float32Array(wasmMem.buffer);
  const memF64 = new Float64Array(wasmMem.buffer);
  const memBUI64 = new BigUint64Array(wasmMem.buffer);
  const memBI64 = new BigInt64Array(wasmMem.buffer);

  const syncArr = new Int32Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.SYNC_ARRAY],
    memSizes[MemRegionsEnum.SYNC_ARRAY] / Int32Array.BYTES_PER_ELEMENT,
  );

  const sleepArr = new Int32Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.SLEEP_ARRAY],
    memSizes[MemRegionsEnum.SLEEP_ARRAY] / Int32Array.BYTES_PER_ELEMENT,
  );

  const workersMemCounters = new Uint32Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.MEM_COUNTERS],
    memSizes[MemRegionsEnum.MEM_COUNTERS],
  );

  const hrTimer = new BigUint64Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.HR_TIMER],
    memSizes[MemRegionsEnum.HR_TIMER] / BigUint64Array.BYTES_PER_ELEMENT,
  );

  const memViews: WasmViews = {
    view,
    memUI8,
    memUIC8,
    memUI16,
    memUI32,
    memI8,
    memI16,
    memI32,
    memF32,
    memF64,
    memBUI64,
    memBI64,
    syncArr,
    sleepArr,
    workersMemCounters,
    hrTimer,
  };

  return memViews;
}

export type { WasmViews };
export { buildWasmMemViews };
