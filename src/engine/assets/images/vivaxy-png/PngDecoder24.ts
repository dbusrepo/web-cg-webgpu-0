import assert from 'assert';
import { decodeColorInfo, decodeSizes, decode } from './decode';
import { BitImage24 } from '../bitImage24';
import { COLOR_TYPES } from './helpers/color-types';
import { PngDecoder } from '../pngDecoder';

class PngDecoder24 implements PngDecoder {
  private checkType(input: ArrayBuffer): void {
    const [bitDepth, colorType] = decodeColorInfo(input);
    assert(bitDepth === 8);
    assert(colorType === COLOR_TYPES.TRUE_COLOR);
  }

  readSize(input: ArrayBuffer): [number, number] {
    this.checkType(input);
    return decodeSizes(input);
  }

  read(input: ArrayBuffer, output: BitImage24): void {
    this.checkType(input);
    const [width, height] = decodeSizes(input);
    output.setSize(width, height);
    decode(input, output.pixels);
  }
}

export { PngDecoder24 };
