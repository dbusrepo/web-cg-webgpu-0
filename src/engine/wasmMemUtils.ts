type MemConfig = {
  startOffset: number;
  rgbaFrameBufferSize: number;
  palIdxFrameBufferSize: number;
  numWorkers: number;
  syncArraySize: number;
  paletteSize: number;
  sleepArraySize: number;
  workerHeapSize: number;
  imagesRegionSize: number;
};

// all regions are bounded except (at least for now) for the last part, the
// shared heap that can grow.
const enum MemRegions {
  RGBA_FRAMEBUFFER = 'RGBA_FRAMEBUFFER',
  PAL_IDX_FRAMEBUFFER = 'PAL_IDX_FRAMEBUFFER',
  PALETTE = 'PALETTE',
  SYNC_ARRAY = 'SYNC_ARRAY',
  SLEEP_ARRAY = 'SLEEP_ARRAY',
  IMAGES = 'IMAGES',
  WORKERS_HEAPS = 'WORKERS_HEAPS',
  HEAP = 'HEAP',
}

type MemRegionKeyType = keyof typeof MemRegions;

// allocation order/layout seq
const MEM_REGIONS_SEQ: MemRegionKeyType[] = [
  MemRegions.RGBA_FRAMEBUFFER,
  MemRegions.PAL_IDX_FRAMEBUFFER,
  MemRegions.PALETTE,
  MemRegions.SYNC_ARRAY,
  MemRegions.SLEEP_ARRAY,
  MemRegions.IMAGES,
  MemRegions.WORKERS_HEAPS,
  MemRegions.HEAP,
];

type MemRegionsData = {
  -readonly [key in MemRegionKeyType]: number;
};

const memRegionsAlignSizes: MemRegionsData = {
  [MemRegions.RGBA_FRAMEBUFFER]: 4,
  [MemRegions.PAL_IDX_FRAMEBUFFER]: 4,
  [MemRegions.PALETTE]: 4,
  [MemRegions.SYNC_ARRAY]: 4,
  [MemRegions.SLEEP_ARRAY]: 4,
  [MemRegions.IMAGES]: 4,
  [MemRegions.WORKERS_HEAPS]: 4,
  [MemRegions.HEAP]: 64,
};

// Calc the (static) sizes of the start regions.
// sizes are in bytes, and they include the alignment space
function calcMemRegionsSizes(config: MemConfig): MemRegionsData {
  const {
    rgbaFrameBufferSize,
    palIdxFrameBufferSize,
    numWorkers,
    imagesRegionSize,
    workerHeapSize,
    syncArraySize,
    sleepArraySize,
    paletteSize,
  } = config;

  const sizes: MemRegionsData = {
    [MemRegions.RGBA_FRAMEBUFFER]: rgbaFrameBufferSize,
    [MemRegions.PAL_IDX_FRAMEBUFFER]: palIdxFrameBufferSize,
    [MemRegions.PALETTE]: paletteSize,
    [MemRegions.SYNC_ARRAY]: syncArraySize,
    [MemRegions.SLEEP_ARRAY]: sleepArraySize,
    [MemRegions.IMAGES]: imagesRegionSize,
    [MemRegions.WORKERS_HEAPS]: numWorkers * workerHeapSize,
    [MemRegions.HEAP]: 0,
  };

  sizes[MemRegions.HEAP] = 0; // force it to 0 'cause it is the last and it can expand

  // console.log(JSON.stringify(sizes));

  return sizes;
}

// function calcImagesRegionSize(images: Assets.WasmImage[]): number {
//   const imagesIndexSize = Assets.WasmImage.OFFSET_SIZE * images.length;
//   const imagesHeaderDataSize = images.reduce(
//     (size, img) => (size += img.size),
//     0,
//   );
//   return imagesIndexSize + imagesHeaderDataSize;
// }

// Calc the (static) offset of the start regions
function calcMemRegionsOffsets(
  config: MemConfig,
  sizes: Readonly<MemRegionsData>,
): MemRegionsData {
  const { startOffset } = config;

  const alignSizes = {} as MemRegionsData;

  for (const region of MEM_REGIONS_SEQ) {
    alignSizes[region] = sizes[region];
    if (sizes[region]) {
      const alignSize = memRegionsAlignSizes[region] - 1;
      alignSizes[region] += alignSize;
    }
  }

  const offsets = {} as MemRegionsData;

  let curOffset = startOffset;

  for (const region of MEM_REGIONS_SEQ) {
    const alignMask = memRegionsAlignSizes[region] - 1;
    offsets[region] = (curOffset + alignMask) & ~alignMask;
    curOffset += alignSizes[region];
  }

  // console.log(JSON.stringify(offsets));

  return offsets;
}

function getMemStartSize(
  startOffset: number,
  sizes: MemRegionsData,
  offsets: MemRegionsData,
): number {
  return offsets[MemRegions.HEAP] + sizes[MemRegions.HEAP] - startOffset;
}

// IMAGES REGION: INDEX IMAGES
// INDEX: rel PTRS (distances) TO IMAGES Ws Hs 
const IMAGE_INDEX_PTR_SIZEOF = Uint32Array.BYTES_PER_ELEMENT;
const IMAGE_INDEX_W_SIZEOF = Uint32Array.BYTES_PER_ELEMENT;
const IMAGE_INDEX_H_SIZEOF = Uint32Array.BYTES_PER_ELEMENT;

function getImageIndexSize(numImages: number) {
  return (
    (IMAGE_INDEX_PTR_SIZEOF + IMAGE_INDEX_W_SIZEOF + IMAGE_INDEX_H_SIZEOF) *
    numImages
  );
}

// bpp bytes per pixel, 1 or 4
function writeImagesIndex(
  imageIndex: Uint32Array,
  imagesOffsets: number[],
  imagesSizes: [number, number][],
  bpp: number,
) {

  // imageIndex[0] = 13;
  // Atomics.store(this._wasmImagesIndex, 0, 13);
  // sleep(this._wasmSleepArr, 0, 50);

  const numImages = imagesSizes.length;
  const WIDTHS_OFFSET = numImages; // skip numImages ptrs
  const HEIGHTS_OFFSET = WIDTHS_OFFSET + numImages;
  for (let i = 0; i < imagesSizes.length; ++i) {
    // Atomics.store(imageIndex, i, imagesOffsets[i]);
    imageIndex[i] = imagesOffsets[i];
    // eslint-disable-next-line prefer-destructuring
    imageIndex[WIDTHS_OFFSET + i] = imagesSizes[i][0]; // save w
    // eslint-disable-next-line prefer-destructuring
    imageIndex[HEIGHTS_OFFSET + i] = imagesSizes[i][1]; // save h
  }
}

export {
  MemConfig,
  MemRegions,
  MemRegionsData,
  calcMemRegionsSizes,
  calcMemRegionsOffsets,
  getMemStartSize,
  getImageIndexSize,
  writeImagesIndex as writeImageIndex,
};
