import { BitImage } from './bitImage';

const BPP = 4;

// true color
class BitImage24 extends BitImage {
  protected _allocPixels(): void {
    const size = BPP * this.width * this.height;
    this._pixels = new Uint8Array(size);
  }
}

export { BitImage24 };
