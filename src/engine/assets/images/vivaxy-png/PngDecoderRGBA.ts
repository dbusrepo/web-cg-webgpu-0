import assert from 'assert';
import { decodeColorInfo, decodeSizes, decode } from './decode';
import { BitImageRGBA } from '../bitImageRGBA';
import { COLOR_TYPES } from './helpers/color-types';
import { PngDecoder } from '../pngDecoder';

class PngDecoderRGBA implements PngDecoder {

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
    console.log(sourcePixels);
    output.setSize(width, height);
    const { pixels } = output;
    switch (metadata.colorType) {
      case COLOR_TYPES.TRUE_COLOR_WITH_ALPHA:
      case COLOR_TYPES.TRUE_COLOR: // alpha = 255 in sourcePixels
      {
        // console.log(metdata.colorType);
        pixels.set(sourcePixels);
      }
      break;
      // TODO other color types ?
      default:
        throw new Error(
          `PngDecoderRGBA read: color type ${metadata.colorType} not supported`,
        );
    }
  }

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

}

export { PngDecoderRGBA };
