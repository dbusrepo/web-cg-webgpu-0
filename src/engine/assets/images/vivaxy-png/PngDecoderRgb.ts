import assert from 'assert';
import { decodeColorInfo, decodeSizes, decode } from './decode';
import { BitImageRGB } from '../bitImageRgb';
import { COLOR_TYPES } from './helpers/color-types';
import { PngDecoder } from '../pngDecoder';

class PngDecoderRGB implements PngDecoder {
  // private checkType(input: ArrayBuffer): void {
  //   const [bitDepth, colorType] = decodeColorInfo(input);
  //   assert(bitDepth === 8);
  //   console.log(colorType);
  //   assert(colorType === COLOR_TYPES.TRUE_COLOR);
  // }

  readSizes(input: ArrayBuffer): [number, number] {
    // this.checkType(input);
    return decodeSizes(input);
  }

  read(input: ArrayBuffer, output: BitImageRGB): void {
    // this.checkType(input);
    const [width, height] = decodeSizes(input);
    output.setSize(width, height);
    const { pixels } = output;
    const metadata = decode(input);
    const { data: sourcePixels } = metadata;
    switch (metadata.colorType) {
      case COLOR_TYPES.TRUE_COLOR:
        pixels.set(sourcePixels);
        break;
      case COLOR_TYPES.TRUE_COLOR_WITH_ALPHA:
        {
          let out = 0;
          for (let i = 0; i < sourcePixels.length; i += 4) {
            pixels[out++] = sourcePixels[i];
            pixels[out++] = sourcePixels[i + 1];
            pixels[out++] = sourcePixels[i + 2];
          }
        }
        break;
      // TODO other color types ?
      default:
        throw new Error('color type unknown');
    }
  }
}

export { PngDecoderRGB };
