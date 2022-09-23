import { myAssert } from './myAssert';
import { alloc, dealloc } from './memManager';
import { ObjectAllocator, newObjectAllocator } from './objectAllocator';

const BITIMAGES_PER_BLOCK: u32 = 128;

class BitImage {

  static size: i32 = offsetof<BitImage>();

  pixels: usize;
  width: u32;
  height: u32;

  private constructor() {}

  init(pixels: usize, width: u32, height: u32): void {
    this.pixels = pixels;
    this.width = width;
    this.height = height;
  }

}

let bitImageAllocator: ObjectAllocator<BitImage>;

function initBitImageAllocator(): void {
  bitImageAllocator = newObjectAllocator<BitImage>(BITIMAGES_PER_BLOCK);
}

// function newBitImage(pixels: usize, width: u32, height: u32): BitImage {
//   const bitImage = arena.alloc();
//   bitImage.init(pixels, width, height);
//   return bitImage;
// }

// function newBitImageArray(size: u32): usize {
//   const ptrsArr = alloc(size * BitImage.size);
//   return ptrsArr;
// }

// function delBitImageArray(array: usize): void {
//   dealloc(array);
// }

// function delBitImage(bitImage: BitImage): void {
//   arena.dealloc(bitImage);
// }

// initBitImage();

export { BitImage, initBitImageAllocator };

// export { BitImage, newBitImage, delBitImage, newBitImageArray };
