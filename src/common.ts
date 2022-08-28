const _1p = 64 * 1024;
const _1mb = 1024 * 1024;
const _1gb = _1mb * 1024;
const _1gp = _1gb / _1p;

const BYTES_PER_PIXEL = 4;
const PAGE_SIZE_BYTES = _1p;
const MILLI_IN_SEC = 1000; // TODO move to common ?
const PALETTE_SIZE = 256;

enum StatsNames {
  FPS = 'FPS',
  UPS = 'UPS',
  UFPS = 'UFPS',
  MEM = 'MEM',
}

type StatsValues = {
  [property in keyof typeof StatsNames]: number;
};

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

export {
  MILLI_IN_SEC,
  PAGE_SIZE_BYTES,
  BYTES_PER_PIXEL,
  PALETTE_SIZE,
  TypedArray,
  StatsNames,
  StatsValues,
};
