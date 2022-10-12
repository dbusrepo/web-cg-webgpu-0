import { MemRegions, MemRegionsData } from './wasmMemUtils';
import { syncStore } from './utils';

type WasmMemViews = {
  memUI8: Uint8Array;
  frameBufferRGBA: Uint8ClampedArray;
  syncArr: Int32Array;
  sleepArr: Int32Array;
  fontChars: Uint8Array;
  strings: Uint8Array;
  imagesIndex: Uint32Array;
  imagesPixels: Uint8Array;
};

function buildWasmMemViews(
  wasmMem: WebAssembly.Memory,
  memOffsets: MemRegionsData,
  memSizes: MemRegionsData,
  workerIdx: number,
): WasmMemViews {
  const startSize = memSizes[MemRegions.START_MEM];
  const startOffset = memOffsets[MemRegions.START_MEM];
  const wasmTotalStartSize = startOffset + startSize;
  const memUI8 = new Uint8Array(wasmMem.buffer, 0, wasmTotalStartSize);

  const frameBufferRGBA = new Uint8ClampedArray(
    wasmMem.buffer,
    memOffsets[MemRegions.FRAMEBUFFER_RGBA],
    memSizes[MemRegions.FRAMEBUFFER_RGBA],
  );

  const syncArr = new Int32Array(
    wasmMem.buffer,
    memOffsets[MemRegions.SYNC_ARRAY],
    memSizes[MemRegions.SYNC_ARRAY] / Int32Array.BYTES_PER_ELEMENT,
  );
  syncStore(syncArr, workerIdx, 0);

  const sleepArr = new Int32Array(
    wasmMem.buffer,
    memOffsets[MemRegions.SLEEP_ARRAY],
    memSizes[MemRegions.SLEEP_ARRAY] / Int32Array.BYTES_PER_ELEMENT,
  );
  syncStore(sleepArr, workerIdx, 0);

  // Assets mem views

  const fontChars = new Uint8Array(
    wasmMem.buffer,
    memOffsets[MemRegions.FONT_CHARS],
    memSizes[MemRegions.FONT_CHARS],
  );

  const strings = new Uint8Array(
    wasmMem.buffer,
    memOffsets[MemRegions.STRINGS],
    memSizes[MemRegions.STRINGS],
  );

  const imagesIndex = new Uint32Array(
    wasmMem.buffer,
    memOffsets[MemRegions.IMAGES_INDEX],
    memSizes[MemRegions.IMAGES_INDEX] / Uint32Array.BYTES_PER_ELEMENT,
  );

  const imagesPixels = new Uint8Array(
    wasmMem.buffer,
    memOffsets[MemRegions.IMAGES],
    memSizes[MemRegions.IMAGES],
  );

  const memViews: WasmMemViews = {
    memUI8,
    frameBufferRGBA,
    syncArr,
    sleepArr,
    imagesIndex,
    imagesPixels,
    fontChars,
    strings,
  };

  return memViews;
}

export { WasmMemViews, buildWasmMemViews };
