import { usePalette, imagesIndexOffset, numImages } from './importVars';
import { BitImage, newBitImageArray } from './bitImage';
import { logi } from './importVars';

function loadImages(): usize {
  const arr = newBitImageArray(numImages);
  const ptrSize: u32 = sizeof<usize>();
  let imgPtr2off = imagesIndexOffset; // index contains offsets to images, widths, heights
  for (let i = 0, offs = 0; i < numImages; i++, offs += BitImage.size) {
    const image = changetype<BitImage>(arr + offs);
    const pixels = imagesIndexOffset + load<u32>(imgPtr2off);
    image.init(pixels, 0, 0);
    imgPtr2off += ptrSize;
  }
  return arr;
}

export { loadImages };
