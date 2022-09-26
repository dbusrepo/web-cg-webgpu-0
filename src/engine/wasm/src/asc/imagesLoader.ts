import { usePalette, imagesIndexOffset, numImages } from './importVars';
import { BitImage } from './bitImage';
import { logi } from './importVars';
import {newSArray} from './sarray';

const IMAGE_INDEX_OFF_SIZE = 4;
type IMAGE_INDEX_PTR_T = u32;

function loadImages(): SArray<T> {
  const bitImages = newSArray<BitImage>(numImages);
  const baseIndex = imagesIndexOffset;
  for (let i = 0, imgPtrOff = 0; i < numImages; i++, imgPtrOff += sizeof<IMAGE_INDEX_PTR_T>()) {
    const image = bitImages.at(i);
    const pixels = load<IMAGE_INDEX_PTR_T>(baseIndex + imgPtr2off);
    image.init(pixels, 0, 0);
  }
  return bitImages;
}

export { loadImages };
