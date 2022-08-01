import { BPP } from '../common';

type MemRegionConfig = {
  frameWidth: number;
  frameHeight: number;
  numWorkers: number;
};

const enum MemoryRegion { // TODO change name?
  FRAMEBUFFER = 'FRAMEBUFFER',
  SYNC_ARRAY = 'SYNC_ARRAY',
  SLEEP_ARRAY = 'SLEEP_ARRAY',
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
  return offsets;
}

export {
  MemRegionConfig,
  MemoryRegion,
  MemoryRegionsData,
  memRegionSizes,
  memRegionOffsets,
};
