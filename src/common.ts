const BPP = 4;
const PAGE_SIZE = 64 * 1024; // 64kb
const MILLI_IN_SEC = 1000; // TODO move to common ?

type Range = [start: number, end: number];

enum StatsNames {
  FPS = 'FPS',
  UPS = 'UPS',
  UFPS = 'UFPS',
  MEM = 'MEM',
}

type StatsValues = {
  [property in keyof typeof StatsNames]: number;
};

type TypedArray = // TODO move?

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
  PAGE_SIZE,
  BPP,
  Range,
  TypedArray,
  StatsNames,
  StatsValues,
};
