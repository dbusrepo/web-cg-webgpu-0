import { MemRegionsEnum, MemRegionsData } from './wasmMemUtils';

type WasmViews = {
  memUI8: Uint8Array;
  frameBufferRGBA: Uint8ClampedArray;
  syncArr: Int32Array;
  sleepArr: Int32Array;
  fontChars: Uint8Array;
  strings: Uint8Array;
  imagesIndex: Uint32Array;
  imagesPixels: Uint8Array;
  workersMemCounters: Uint32Array;
  inputKeys: Uint8Array;
  hrTimer: BigUint64Array;
};

function buildWasmMemViews(
  wasmMem: WebAssembly.Memory,
  memOffsets: MemRegionsData,
  memSizes: MemRegionsData,
): WasmViews {
  const startSize = memSizes[MemRegionsEnum.START_MEM];
  const startOffset = memOffsets[MemRegionsEnum.START_MEM];
  const wasmTotalStartSize = startOffset + startSize;
  const memUI8 = new Uint8Array(wasmMem.buffer, 0, wasmTotalStartSize);

  const frameBufferRGBA = new Uint8ClampedArray(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.FRAMEBUFFER_RGBA],
    memSizes[MemRegionsEnum.FRAMEBUFFER_RGBA],
  );

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

  const fontChars = new Uint8Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.FONT_CHARS],
    memSizes[MemRegionsEnum.FONT_CHARS],
  );

  const strings = new Uint8Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.STRINGS],
    memSizes[MemRegionsEnum.STRINGS],
  );

  const imagesIndex = new Uint32Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.IMAGES_INDEX],
    memSizes[MemRegionsEnum.IMAGES_INDEX] / Uint32Array.BYTES_PER_ELEMENT,
  );

  const imagesPixels = new Uint8Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.IMAGES],
    memSizes[MemRegionsEnum.IMAGES],
  );

  const workersMemCounters = new Uint32Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.MEM_COUNTERS],
    memSizes[MemRegionsEnum.MEM_COUNTERS],
  );

  const inputKeys = new Uint8Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.INPUT_KEYS],
    memSizes[MemRegionsEnum.INPUT_KEYS],
  );

  const hrTimer = new BigUint64Array(
    wasmMem.buffer,
    memOffsets[MemRegionsEnum.HR_TIMER],
    memSizes[MemRegionsEnum.HR_TIMER] / BigUint64Array.BYTES_PER_ELEMENT,
  );

  const memViews: WasmViews = {
      memUI8,
      frameBufferRGBA,
      syncArr,
      sleepArr,
      imagesIndex,
      imagesPixels,
      fontChars,
      strings,
      workersMemCounters,
      inputKeys,
      hrTimer,
  };

  return memViews;
}

export type { WasmViews };
export { buildWasmMemViews };
