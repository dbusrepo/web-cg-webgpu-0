import { BPP, PAGE_SIZE } from '../common';
import { defaultConfig } from '../config/config';

const WORKER_HEAP_SIZE = PAGE_SIZE * defaultConfig.worker_heap_pages;

type MemRegionConfig = {
  frameWidth: number;
  frameHeight: number;
  numWorkers: number;
};

const enum MemoryRegion { // TODO change name?
  FRAMEBUFFER = 'FRAMEBUFFER',
  SYNC_ARRAY = 'SYNC_ARRAY',
  SLEEP_ARRAY = 'SLEEP_ARRAY',
  WORKERS_HEAP = 'WORKERS_HEAP',
  HEAP = 'HEAP',
}

type MemoryRegionsData = {
  -readonly [key in keyof typeof MemoryRegion]: number;
};

function memRegionSizes(config: MemRegionConfig): MemoryRegionsData {
  const sizes = {} as MemoryRegionsData;

  // framebuffer
  const frameBufferSize = config.frameWidth * config.frameHeight * BPP;
  sizes[MemoryRegion.FRAMEBUFFER] = frameBufferSize;
  // sync array
  const syncArraySize = config.numWorkers * 4; // TODO check alignment?
  sizes[MemoryRegion.SYNC_ARRAY] = syncArraySize;
  // sleep array
  const sleepArraySize = config.numWorkers * 4; // check alignment?
  sizes[MemoryRegion.SLEEP_ARRAY] = sleepArraySize;
  // workers heaps
  const workersHeapSize = config.numWorkers * WORKER_HEAP_SIZE;
  sizes[MemoryRegion.WORKERS_HEAP] = workersHeapSize;

  return sizes;
}

function memRegionOffsets(
  config: MemRegionConfig,
  sizes: MemoryRegionsData,
): MemoryRegionsData {
  const offsets = {} as MemoryRegionsData;
  let offset: number;
  // framebuffer
  offset = 0;
  offsets[MemoryRegion.FRAMEBUFFER] = offset;
  // sync array
  offset += sizes[MemoryRegion.FRAMEBUFFER]; // check align?
  offsets[MemoryRegion.SYNC_ARRAY] = offset;
  // sleep array
  offset += sizes[MemoryRegion.SYNC_ARRAY]; // check align?
  offsets[MemoryRegion.SLEEP_ARRAY] = offset;
  // worker heap size
  offset += sizes[MemoryRegion.SLEEP_ARRAY];
  offsets[MemoryRegion.WORKERS_HEAP] = offset;

  // shared heap
  const lastReg = MemoryRegion.WORKERS_HEAP; // change this if you add another
  offset += sizes[lastReg];
  offsets[MemoryRegion.HEAP] = offset;
  return offsets;
}

export {
  MemRegionConfig,
  MemoryRegion,
  MemoryRegionsData,
  memRegionSizes,
  memRegionOffsets,
  WORKER_HEAP_SIZE,
};
