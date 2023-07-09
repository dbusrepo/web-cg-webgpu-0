import { texturesIndexPtr, numTextures } from './importVars';
import { BitImageRGBA } from './bitImageRGBA';
import { logi } from './importVars';
import { SArray, newSArray } from './sarray';
import { PTR_T, SIZE_T } from './memUtils';

function initTextures(): SArray<BitImageRGBA> {
  const bitImages = newSArray<BitImageRGBA>(numTextures);
  for (let i: usize = 0; i < numTextures; i++) {
    const image = bitImages.at(i);
    image.init(i);
  }
  return bitImages;
}

export { initTextures };
