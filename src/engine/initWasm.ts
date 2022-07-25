import { AscWasmInput, AscExports, loadAscModules } from "./initAscWasm";

// ****** WASM IMPORT (wasm built from wat)
// import clear_canvas_wasm from './wasm/build/wat/clear_canvas.wasm';
// import clear_test_wasm from './wasm/bin/clear_test.wasm';

/* */

// TODO import ?
const BPP = 4;
const INITIAL_RESERVED_SIZE = 1000;

/* */

interface WasmInput {
  memory: WebAssembly.Memory;
  frameWidth: number;
  frameHeight: number;
}

/* */

const enum MemoryRegion {
  RESERVED = 'RESERVED',
  FRAMEBUFFER = 'FRAMEBUFFER',
};

type MemRegionNames = keyof typeof MemoryRegion;

// type to hold regions info both as key->info and as [idx]->info
type MemoryRegionsData = number[] & {
  [key in MemRegionNames]: number;
};

interface MemoryRegionsInfo {
  memOffsets: MemoryRegionsData;
  memSizes: MemoryRegionsData;
};

interface WasmData {
  memory: WebAssembly.Memory;
  ascExports: AscExports;
  memOffsets: MemoryRegionsData;
  memSizes: MemoryRegionsData;
  ui8mem: Uint8Array;
  ui32mem: Uint32Array;
  ui8cFramebuffer: Uint8ClampedArray;
}


const buildMemRegionsOffset = (
  wasmInput: WasmInput,
): MemoryRegionsInfo => {
  const { frameWidth, frameHeight } = wasmInput;

  const memOffsets: MemoryRegionsData = [] as unknown as MemoryRegionsData;
  const memSizes: MemoryRegionsData = [] as unknown as MemoryRegionsData;

  const addMemoryRegion = (
    off: number,
    size: number,
    key: MemoryRegion,
  ): number => {
    memOffsets.push(off);
    memOffsets[key] = off;
    memSizes.push(size);
    memSizes[key] = size;
    return off + size;
  };

  let offset = 0; // in bytes...

  const reservedSize = INITIAL_RESERVED_SIZE; // TODO remove?
  offset = addMemoryRegion(offset, reservedSize, MemoryRegion.RESERVED);

  const frameBufferSize = frameWidth * frameHeight * BPP;
  offset = addMemoryRegion(
    offset,
    frameBufferSize,
    MemoryRegion.FRAMEBUFFER,
  );

  // ... TODO

  return { memOffsets, memSizes };
};

async function initAscWasm(wasmInit: WasmInput, memRegionsInfo: MemoryRegionsInfo): Promise<AscExports> {
  const ascWasmInit: AscWasmInput = {
    ...wasmInit,
    frameBufferOffset: memRegionsInfo.memOffsets[MemoryRegion.FRAMEBUFFER],
  };
  const ascExports = await loadAscModules(ascWasmInit);
  return ascExports;
}

async function initWasm(wasmInit: WasmInput): Promise<WasmData> {

  const memRegions = buildMemRegionsOffset(wasmInit);
  const ascExports = await initAscWasm(wasmInit, memRegions);

  const { memOffsets, memSizes } = memRegions;
  const memory = wasmInit.memory;
  const ui8mem = new Uint8Array(memory.buffer);
  const ui32mem = new Uint32Array(memory.buffer);
  const ui8cFramebuffer = new Uint8ClampedArray(
    memory.buffer,
    memOffsets[MemoryRegion.FRAMEBUFFER],
    memSizes[MemoryRegion.FRAMEBUFFER],
  );

  return {
    memory,
    ascExports,
    memOffsets,
    memSizes,
    ui8mem,
    ui32mem,
    ui8cFramebuffer,
  };
}

export {
  WasmInput,
  WasmData, // output w
  MemoryRegion,
  initWasm,
};
