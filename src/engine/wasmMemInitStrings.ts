// IMAGES REGION LAYOUT: 

// INDEX with ptrs to strings, strings data
// Note: strings are null terminated

const OFFS_2_STR_SIZE = Uint32Array.BYTES_PER_ELEMENT;

function getStringsIndexSize(stringsArrayDataIndex: Uint8Array) {
  return OFFS_2_STR_SIZE * stringsArrayDataIndex.length;
}

function writeStringsIndex(
  imageIndex: Uint32Array,
  imagesOffsets: number[],
  imagesSizes: [number, number][],
) {
  const numImages = imagesOffsets.length;
  const PTRS_2_IMGS_OFFS = 0;
  const WIDTHS_OFFS = PTRS_2_IMGS_OFFS + numImages;
  const HEIGHTS_OFFS = WIDTHS_OFFS + numImages;
  for (let i = 0; i < imagesSizes.length; ++i) {
    // Atomics.store(imageIndex, i, imagesOffsets[i]);
    imageIndex[PTRS_2_IMGS_OFFS + i] = imagesOffsets[i];
    const [ width, height ] = imagesSizes[i];
    imageIndex[WIDTHS_OFFS + i] = width;
    imageIndex[HEIGHTS_OFFS + i] = height;
    // console.log('Image: ', i, width, height);
  }
}

export {
  getStringsIndexSize,
  writeStringsIndex,
};
