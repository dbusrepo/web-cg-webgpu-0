const _1p = 64 * 1024;
const _1mb = 1024 * 1024;
const _1gb = _1mb * 1024;
const _1gp = _1gb / _1p;

const BPP_PAL = 1; // TODO ?
const BPP_RGBA = 4;
const PAL_ENTRY_SIZE = 3;
const PAGE_SIZE_BYTES = _1p;
const MILLI_IN_SEC = 1000; // TODO move to common ?
const PALETTE_SIZE = 256;

enum StatsNames {
  FPS = 'FPS',
  UPS = 'UPS',
  UFPS = 'UFPS',
  MEM = 'MEM',
  WASM_HEAP = 'WASM_HEAP', // heap mem allocated by wasm workers in the private heap + in the shared heap
}

type StatsValues = {
  [property in keyof typeof StatsNames]: number;
};

// type TypedArray =
//   | Int8Array
//   | Uint8Array
//   | Uint8ClampedArray
//   | Int16Array
//   | Uint16Array
//   | Int32Array
//   | Uint32Array
//   | Float32Array
//   | Float64Array;

export {
  BPP_PAL,
  BPP_RGBA,
  MILLI_IN_SEC,
  PAGE_SIZE_BYTES,
  PAL_ENTRY_SIZE,
  PALETTE_SIZE,
  StatsNames,
  StatsValues,
};
