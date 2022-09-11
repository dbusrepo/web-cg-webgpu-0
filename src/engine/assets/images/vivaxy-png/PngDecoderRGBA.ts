import assert from 'assert';
import { decodeColorInfo, decodeSizes, decode } from './decode';
import { BitImageRGBA } from '../bitImageRGBA';
import { COLOR_TYPES } from './helpers/color-types';
import { PngDecoder } from '../pngDecoder';

class PngDecoderRGBA implements PngDecoder {
  // private checkType(input: ArrayBuffer): void {
  //   const [bitDepth, colorType] = decodeColorInfo(input);
  //   assert(bitDepth === 8);
  //   console.log(colorType);
  //   assert(colorType === COLOR_TYPES.TRUE_COLOR);
  // }

  // const [bitDepth, colorType] = decodeColorInfo(input);
  // assert(bitDepth === 8);
  // switch (colorType) {
  //   case COLOR_TYPES.TRUE_COLOR_WITH_ALPHA:
  //   case COLOR_TYPES.TRUE_COLOR:
  //     return [...sizes, 4]; // then we map rgb to rgba with alpha 255
  //   // break;
  //   // TODO other color types ?
  //   default:
  //     throw new Error(
  //       `PngDecoderRGBA readSizes: color type ${colorType} not supported`,
  //     );

  // returns [w, h, bytes per pixel]. Used to allocate space for a BitImageRGBA
  readSizes(input: ArrayBuffer): [number, number] {
    // this.checkType(input);
    const sizes = decodeSizes(input);
    return sizes;
  }

  read(input: ArrayBuffer, output: BitImageRGBA): void {
    // this.checkType(input);
    const metadata = decode(input);
    const { width, height, data: sourcePixels } = metadata;
    output.setSize(width, height);
    const { pixels } = output;
    switch (metadata.colorType) {
      case COLOR_TYPES.TRUE_COLOR_WITH_ALPHA:
        // console.log(pixels);
        pixels.set(sourcePixels);
        break;
      case COLOR_TYPES.TRUE_COLOR:
        {
          let out = 0;
          for (let i = 0; i < sourcePixels.length; i += 3) {
            pixels[out++] = sourcePixels[i];
            pixels[out++] = sourcePixels[i + 1];
            pixels[out++] = sourcePixels[i + 2];
            pixels[out++] = 255;
          }
        }
        break;
      // TODO other color types ?
      default:
        throw new Error(
          `PngDecoderRGBA read: color type ${metadata.colorType} not supported`,
        );
    }
  }
}

export { PngDecoderRGBA };
