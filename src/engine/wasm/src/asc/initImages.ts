import { usePalette, imagesIndexOffset, numImages } from './importVars';
import { BitImage } from './bitImage';
import { logi } from './importVars';
import { SArray, newSArray } from './sarray';
import { PTR_T, SIZE_T } from './memUtils';

// index field
type IMG_OFFS_T = u32; // used for offsets to pixels
type IMG_SIZE_T = u32; // used for widths and heights
const IMG_OFF_FIELD_SIZE: i32 = sizeof<IMG_OFFS_T>();
const IMG_SIZE_FIELD_SIZE: i32 = sizeof<IMG_SIZE_T>();

function initImages(): SArray<BitImage> {
  const bitImages = newSArray<BitImage>(numImages);
  let imgPtrPtr: PTR_T = imagesIndexOffset;
  let widthPtr = imgPtrPtr + numImages * IMG_OFF_FIELD_SIZE;
  let heightPtr = widthPtr + numImages * IMG_SIZE_FIELD_SIZE;
  for (let i = 0; i < numImages; i++) {
    const pixels = load<IMG_OFFS_T>(imgPtrPtr);
    const width = load<IMG_SIZE_T>(widthPtr);
    const height = load<IMG_SIZE_T>(heightPtr);
    const image = bitImages.at(i);
    image.init(pixels, width, height);
    imgPtrPtr += IMG_OFF_FIELD_SIZE;
    widthPtr += IMG_SIZE_FIELD_SIZE;
    heightPtr += IMG_SIZE_FIELD_SIZE;
  }
  return bitImages;
}

export { initImages };
