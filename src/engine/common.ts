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

export { Range, TypedArray, StatsNames, StatsValues };
