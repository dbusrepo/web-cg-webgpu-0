import { myAssert } from './myAssert';
import { PTR_T, SIZE_T } from './memUtils';
import { alloc, dealloc } from './memManager';
import { ObjectAllocator, newObjectAllocator } from './objectAllocator';
import { imagesIndexOffset, numImages } from './importVars';

// index fields types
type IMG_OFF_T = u32; // used for offsets to pixels
type IMG_SIZE_T = u32; // used for widths and heights
const IMG_OFF_SIZE = sizeof<IMG_OFF_T>();
const IMG_WH_SIZE = sizeof<IMG_SIZE_T>();

// index sections offsets
const imgPtrPtrs: PTR_T = imagesIndexOffset;
const imgWidths = imgPtrPtrs + <usize>numImages * IMG_OFF_SIZE;
const imgHeights = imgWidths + <usize>numImages * IMG_WH_SIZE;

@final @unmanaged class BitImage {

  private _imgIdx: u32 = 0;

  init(idx: u32): void {
    myAssert(idx >= 0 && idx < numImages);
    this._imgIdx = idx;
  }

  @inline get pixels(): PTR_T {
    return imgPtrPtrs + load<IMG_OFF_T>(imgPtrPtrs + <usize>this._imgIdx * IMG_OFF_SIZE);
  }

  @inline get width(): SIZE_T {
    return load<IMG_SIZE_T>(imgWidths + <usize>this._imgIdx * IMG_WH_SIZE);
  }

  @inline get height(): SIZE_T {
    return load<IMG_SIZE_T>(imgHeights + <usize>this._imgIdx * IMG_WH_SIZE);
  }
}

let bitImageAlloc: ObjectAllocator<BitImage>;

function initBitImageAllocator(): void {
  const BITIMAGES_PER_BLOCK = 128;
  bitImageAlloc = newObjectAllocator<BitImage>(BITIMAGES_PER_BLOCK);
}

export { BitImage, initBitImageAllocator, bitImageAlloc };
