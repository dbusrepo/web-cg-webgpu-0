// IMAGES REGION LAYOUT: 

// First there is an INDEX and then the IMAGES data (pixels)
// INDEX LAYOUT: ptrs to images start, widths, heights (32bit each)

// Note: all fields in the images index use 32 bits

// field sizes
const PTR_2_IMG_SIZE = Uint32Array.BYTES_PER_ELEMENT;
const WIDTH_SIZE = Uint32Array.BYTES_PER_ELEMENT;
const HEIGHT_SIZE = Uint32Array.BYTES_PER_ELEMENT;

function getImageIndexSizeBytes(numImages: number) {
  return (
    (PTR_2_IMG_SIZE + WIDTH_SIZE + HEIGHT_SIZE) *
    numImages
  );
}

function writeImageIndex(
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
    console.log('Image: ', i, width, height);
  }
}

export {
  getImageIndexSizeBytes,
  writeImageIndex,
};
