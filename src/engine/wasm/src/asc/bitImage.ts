import { myAssert } from './myAssert';
import { PTR_T, SIZE_T } from './memUtils';
import { alloc, dealloc } from './memManager';
import { ObjectAllocator, newObjectAllocator } from './objectAllocator';
import { imagesIndexOffset } from './importVars';

@final @unmanaged class BitImage {

  private _pixels: PTR_T = 0;
  private _width: u32 = 0;
  private _height: u32 = 0;

  init(pixels: PTR_T, width: u32, height: u32): void {
    this._pixels = pixels;
    this._width = width;
    this._height = height;
  }

  @inline get pixels(): PTR_T {
    return imagesIndexOffset + this._pixels;
  }

  @inline get width(): SIZE_T {
    return this._width;
  }

  @inline get height(): SIZE_T {
    return this._height;
  }
}

let bitImageAlloc: ObjectAllocator<BitImage>;

function initBitImageAllocator(): void {
  const BITIMAGES_PER_BLOCK = 128;
  bitImageAlloc = newObjectAllocator<BitImage>(BITIMAGES_PER_BLOCK);
}

export { BitImage, initBitImageAllocator, bitImageAlloc };
