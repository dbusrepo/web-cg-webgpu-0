// IMAGES REGION LAYOUT: 

// INDEX with images ptrs and sizes, IMAGES data (pixels)
// INDEX LAYOUT: offsets to images start, widths, heights (32bit each)
// offsets to images wrt to image data start

// field sizes
const OFFS_IMG_SIZE = Uint32Array.BYTES_PER_ELEMENT;
const WIDTH_SIZE = Uint32Array.BYTES_PER_ELEMENT;
const HEIGHT_SIZE = Uint32Array.BYTES_PER_ELEMENT;

function getImagesIndexSize(numImages: number) {
  return (
    (OFFS_IMG_SIZE + WIDTH_SIZE + HEIGHT_SIZE) *
    numImages
  );
}

function writeImagesIndex(
  imageIndex: Uint32Array,
  imagesOffsets: number[],
  imagesSizes: [number, number][],
) {
  const numImages = imagesOffsets.length;
  const PTR_2_IMGS_OFFS = 0;
  const WIDTHS_OFFS = PTR_2_IMGS_OFFS + numImages;
  const HEIGHTS_OFFS = WIDTHS_OFFS + numImages;
  for (let i = 0; i < imagesSizes.length; ++i) {
    // Atomics.store(imageIndex, i, imagesOffsets[i]);
    imageIndex[PTR_2_IMGS_OFFS + i] = imagesOffsets[i];
    const [ width, height ] = imagesSizes[i];
    imageIndex[WIDTHS_OFFS + i] = width;
    imageIndex[HEIGHTS_OFFS + i] = height;
    // console.log('Image: ', i, width, height);
  }
}

export {
  getImagesIndexSize,
  writeImagesIndex,
};
