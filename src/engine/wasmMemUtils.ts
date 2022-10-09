import assert from 'assert';
import * as initViews from './wasmMemViews';
import * as initImages from './wasmMemInitImages';

type MemConfig = {
  startOffset: number;
  frameBufferRGBASize: number;
  frameBufferPalSize: number;
  numWorkers: number;
  syncArraySize: number;
  paletteSize: number;
  sleepArraySize: number;
  workerHeapSize: number;
  imagesRegionSize: number;
  sharedHeapSize: number;
};

// all regions are bounded except (at least for now) for the last part, the
// shared heap that can grow.
const enum MemRegions {
  FRAMEBUFFER_RGBA = 'FRAMEBUFFER_RGBA',
  FRAMEBUFFER_PAL = 'FRAMEBUFFER_PAL',
  PALETTE = 'PALETTE',
  SYNC_ARRAY = 'SYNC_ARRAY',
  SLEEP_ARRAY = 'SLEEP_ARRAY',
  IMAGES = 'IMAGES',
  WORKERS_HEAPS = 'WORKERS_HEAPS',
  HEAP = 'HEAP',
  START_MEM = 'START_MEM', // for the size/offset of all previous mem regions
}

type MemRegionKeyType = keyof typeof MemRegions;


type MemRegionsData = {
  -readonly [key in MemRegionKeyType]: number;
};


function getMemRegionsSizes(config: MemConfig): MemRegionsData {
  const {
    startOffset,
    frameBufferRGBASize,
    frameBufferPalSize,
    numWorkers,
    imagesRegionSize,
    workerHeapSize,
    syncArraySize,
    sleepArraySize,
    paletteSize,
    sharedHeapSize,
  } = config;

  const sizes: MemRegionsData = {
    [MemRegions.FRAMEBUFFER_RGBA]: frameBufferRGBASize,
    [MemRegions.FRAMEBUFFER_PAL]: frameBufferPalSize,
    [MemRegions.PALETTE]: paletteSize,
    [MemRegions.SYNC_ARRAY]: syncArraySize,
    [MemRegions.SLEEP_ARRAY]: sleepArraySize,
    [MemRegions.IMAGES]: imagesRegionSize,
    [MemRegions.WORKERS_HEAPS]: numWorkers * workerHeapSize,
    [MemRegions.HEAP]: sharedHeapSize,
    [MemRegions.START_MEM]: 0, // set later
  };

  // console.log(JSON.stringify(sizes));
  return sizes;
}

function getMemRegionsOffsets(
  config: MemConfig,
  sizes: Readonly<MemRegionsData>,
): MemRegionsData {

  // lg of align req
  const memRegLgAlign: MemRegionsData = {
    [MemRegions.FRAMEBUFFER_RGBA]: 2,
    [MemRegions.FRAMEBUFFER_PAL]: 2,
    [MemRegions.PALETTE]: 2,
    [MemRegions.SYNC_ARRAY]: 2,
    [MemRegions.SLEEP_ARRAY]: 2,
    [MemRegions.IMAGES]: 2,
    [MemRegions.WORKERS_HEAPS]: 2,
    [MemRegions.HEAP]: 6,
    [MemRegions.START_MEM]: 0, // not used
  };

  const memRegionsAllocSeq: MemRegionKeyType[] = [
    MemRegions.FRAMEBUFFER_RGBA,
    MemRegions.FRAMEBUFFER_PAL,
    MemRegions.PALETTE,
    MemRegions.SYNC_ARRAY,
    MemRegions.SLEEP_ARRAY,
    MemRegions.IMAGES,
    MemRegions.WORKERS_HEAPS,
    MemRegions.HEAP,
  ];

  const offsets = {} as MemRegionsData;
  let curOffset = config.startOffset;

  for (const region of memRegionsAllocSeq) {
    const alignMask = (1 << memRegLgAlign[region]) - 1;
    const nextOffset = (curOffset + alignMask) & ~alignMask;
    offsets[region] = nextOffset;
    curOffset = nextOffset + sizes[region];
  }

  return  offsets;
}

// returns sizes and offsets
function getMemRegionsSizesAndOffsets(
  config: MemConfig,
): [MemRegionsData, MemRegionsData] {
  const regionsSizes = getMemRegionsSizes(config);
  const regionsOffsets = getMemRegionsOffsets(config, regionsSizes);

  const { startOffset } = config;
  regionsOffsets[MemRegions.START_MEM] = startOffset;
  const startSize =
    regionsOffsets[MemRegions.HEAP] +
    regionsSizes[MemRegions.HEAP] - // 0 if the heaps expands freely 
    startOffset;
  regionsSizes[MemRegions.START_MEM] = startSize;

  return [regionsSizes, regionsOffsets];
}

export {
  MemConfig,
  MemRegions,
  MemRegionsData,
  getMemRegionsSizesAndOffsets,
  initImages,
  initViews,
};
