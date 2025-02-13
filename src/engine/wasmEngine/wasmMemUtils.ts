// import assert from 'assert';

interface WasmMemParams {
  startOffset: number;
  numWorkers: number;
  syncArraySize: number;
  sleepArraySize: number;
  workerHeapSize: number;
  sharedHeapSize: number;
  workersMemCountersSize: number;
  hrTimerSize: number;
}

// all regions have bounds except for the last part, the shared heap that can grow
// enum for mem regions keys used to index their sizes/offsets
const enum MemRegionsEnum {
  SYNC_ARRAY = 'SYNC_ARRAY',
  SLEEP_ARRAY = 'SLEEP_ARRAY',
  WORKERS_HEAPS = 'WORKERS_HEAPS',
  HEAP = 'HEAP',
  MEM_COUNTERS = 'MEM_COUNTERS',
  HR_TIMER = 'HR_TIMER',
  START_MEM = 'START_MEM', // for the size/offset of all previous mem regions
}

type MemRegionKeyType = keyof typeof MemRegionsEnum;

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
type WasmMemRegionsData = {
  -readonly [key in MemRegionKeyType]: number;
};

function getMemRegionsSizes(params: WasmMemParams): WasmMemRegionsData {
  const {
    // frameBufferPalSize,
    // paletteSize,
    numWorkers,
    workerHeapSize,
    syncArraySize,
    sleepArraySize,
    sharedHeapSize,
    workersMemCountersSize,
    hrTimerSize,
  } = params;

  const sizes: WasmMemRegionsData = {
    // [MemRegionsEnum.FRAMEBUFFER_PAL]: frameBufferPalSize,
    // [MemRegionsEnum.PALETTE]: paletteSize,
    [MemRegionsEnum.SYNC_ARRAY]: syncArraySize,
    [MemRegionsEnum.SLEEP_ARRAY]: sleepArraySize,
    [MemRegionsEnum.WORKERS_HEAPS]: numWorkers * workerHeapSize,
    [MemRegionsEnum.HEAP]: sharedHeapSize,
    [MemRegionsEnum.MEM_COUNTERS]: workersMemCountersSize,
    [MemRegionsEnum.HR_TIMER]: hrTimerSize,
    [MemRegionsEnum.START_MEM]: 0,
  };

  // console.log(JSON.stringify(sizes));

  return sizes;
}

function getMemRegionsOffsets(
  params: WasmMemParams,
  sizes: Readonly<WasmMemRegionsData>,
): WasmMemRegionsData {
  // for each new section add its alignment here
  // lg of align req
  const memRegLgAlign: WasmMemRegionsData = {
    // [MemRegionsEnum.FRAMEBUFFER_PAL]: 2,
    // [MemRegionsEnum.PALETTE]: 2,
    [MemRegionsEnum.SYNC_ARRAY]: 2,
    [MemRegionsEnum.SLEEP_ARRAY]: 2,
    [MemRegionsEnum.WORKERS_HEAPS]: 2,
    [MemRegionsEnum.HEAP]: 6,
    [MemRegionsEnum.MEM_COUNTERS]: 2,
    [MemRegionsEnum.HR_TIMER]: 3,
    [MemRegionsEnum.START_MEM]: 0,
  };

  // for each new section add it in the region alloc order here
  const memRegionsAllocSeq: MemRegionKeyType[] = [
    // MemRegionsEnum.FRAMEBUFFER_PAL,
    // MemRegionsEnum.PALETTE,
    MemRegionsEnum.HR_TIMER,
    MemRegionsEnum.SYNC_ARRAY,
    MemRegionsEnum.SLEEP_ARRAY,
    MemRegionsEnum.MEM_COUNTERS,
    MemRegionsEnum.WORKERS_HEAPS,
    MemRegionsEnum.HEAP,
  ];

  // check seq in memRegionsAllocSeq and no duplicates ?

  const offsets = {} as WasmMemRegionsData;
  let curOffset = params.startOffset;

  for (const region of memRegionsAllocSeq) {
    const alignMask = (1 << memRegLgAlign[region]) - 1;
    const nextOffset = (curOffset + alignMask) & ~alignMask;
    offsets[region] = nextOffset;
    curOffset = nextOffset + sizes[region];
  }

  return offsets;
}

// returns sizes and offsets
function getMemRegionsSizesAndOffsets(
  params: WasmMemParams,
): [WasmMemRegionsData, WasmMemRegionsData] {
  const regionsSizes = getMemRegionsSizes(params);
  const regionsOffsets = getMemRegionsOffsets(params, regionsSizes);

  const { startOffset } = params;
  regionsOffsets[MemRegionsEnum.START_MEM] = startOffset;
  const startSize =
    regionsOffsets[MemRegionsEnum.HEAP] +
    regionsSizes[MemRegionsEnum.HEAP] - // 0 if the shared heap expands freely
    startOffset;
  regionsSizes[MemRegionsEnum.START_MEM] = startSize;

  return [regionsSizes, regionsOffsets];
}

export type { WasmMemParams, WasmMemRegionsData };

export { MemRegionsEnum, getMemRegionsSizesAndOffsets };
