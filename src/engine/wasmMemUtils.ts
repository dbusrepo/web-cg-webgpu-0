import * as Assets from './image';

type MemConfig = {
  startOffset: number;
  rgbaFrameBufferSize: number;
  palIdxFrameBufferSize: number;
  numWorkers: number;
  syncArraySize: number;
  paletteSize: number;
  sleepArraySize: number;
  workerHeapSize: number;
  images: Assets.WasmImage[];
};

// all regions are bounded except (at least for now) for the last part, the
// shared heap that can grow.
const enum MemRegions { // TODO change name?
  RGBA_FRAMEBUFFER = 'RGBA_FRAMEBUFFER',
  PAL_IDX_FRAMEBUFFER = 'PAL_IDX_FRAMEBUFFER',
  PALETTE = 'PALETTE',
  SYNC_ARRAY = 'SYNC_ARRAY',
  SLEEP_ARRAY = 'SLEEP_ARRAY',
  IMAGES = 'IMAGES',
  WORKERS_HEAP = 'WORKERS_HEAP',
  HEAP = 'HEAP',
}

const LAST_MEM_REG = 'HEAP';

type MemRegionsData = {
  -readonly [key in keyof typeof MemRegions]: number;
};

// Calc the (static) sizes of the start regions.
// sizes are in bytes
function calcMemRegionsSizes(config: MemConfig): MemRegionsData {
  const {
    rgbaFrameBufferSize,
    palIdxFrameBufferSize,
    numWorkers,
    images,
    workerHeapSize,
    syncArraySize,
    sleepArraySize,
    paletteSize,
  } = config;

  const sizes = {} as MemRegionsData;

  // rgba framebuffer
  sizes[MemRegions.RGBA_FRAMEBUFFER] = rgbaFrameBufferSize;
  sizes[MemRegions.PAL_IDX_FRAMEBUFFER] = palIdxFrameBufferSize;
  sizes[MemRegions.PALETTE] = paletteSize;
  sizes[MemRegions.SYNC_ARRAY] = syncArraySize;
  sizes[MemRegions.SLEEP_ARRAY] = sleepArraySize;
  // workers heaps
  const workersHeapsSize = numWorkers * workerHeapSize;
  sizes[MemRegions.WORKERS_HEAP] = workersHeapsSize;
  // images
  const imagesIndexSize = Assets.WasmImage.OFFSET_SIZE * images.length;
  const imagesHeaderDataSize = images.reduce(
    (size, img) => (size += img.size),
    0,
  );
  const imagesSize = imagesIndexSize + imagesHeaderDataSize;
  sizes[MemRegions.IMAGES] = imagesSize;

  // last mem region: the shared heap
  // it can expand and it is the last region, so we set it to 0.
  // used in the total size formula below
  sizes[MemRegions.HEAP] = 0;

  return sizes;
}

// Calc the (static) offset of the start regions
function calcMemRegionsOffsets(
  config: MemConfig,
  sizes: MemRegionsData,
): MemRegionsData {
  const { startOffset } = config;

  // TODO check alignments ?

  const offsets = {} as MemRegionsData;

  let offs = startOffset;

  // rgba framebuffer
  offsets[MemRegions.RGBA_FRAMEBUFFER] = offs;
  offs += sizes[MemRegions.RGBA_FRAMEBUFFER];

  // palette indexes framebuffer
  offsets[MemRegions.PAL_IDX_FRAMEBUFFER] = offs;
  offs += sizes[MemRegions.PAL_IDX_FRAMEBUFFER];

  // palette
  offsets[MemRegions.PALETTE] = offs;
  offs += sizes[MemRegions.PALETTE];

  // sync array
  offsets[MemRegions.SYNC_ARRAY] = offs;
  offs += sizes[MemRegions.SYNC_ARRAY];

  // sleep array
  offsets[MemRegions.SLEEP_ARRAY] = offs;
  offs += sizes[MemRegions.SLEEP_ARRAY];

  // images
  offsets[MemRegions.IMAGES] = offs; // offset alignment to 4/8 bytes ?
  offs += sizes[MemRegions.IMAGES];

  // private worker heap
  offsets[MemRegions.WORKERS_HEAP] = offs;
  offs += sizes[MemRegions.WORKERS_HEAP];

  // shared heap
  offsets[MemRegions.HEAP] = offs;

  return offsets;
}

// the shared heap is the last part of the memory and it can expand. The
// starting allocated memory starts from the startOffset and ends where the
// shared heap starts.
function getMemStartSize(
  startOffset: number,
  sizes: MemRegionsData,
  offsets: MemRegionsData,
): number {
  return offsets[LAST_MEM_REG] + sizes[LAST_MEM_REG] - startOffset;
}

export {
  MemConfig,
  MemRegions,
  MemRegionsData,
  calcMemRegionsSizes,
  calcMemRegionsOffsets,
  getMemStartSize,
};
