import { myAssert } from './myAssert';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { alloc, dealloc } from './workerHeapAlloc';

const BITIMAGES_PER_BLOCK: u32 = 128;

let arena: ArenaAlloc<BitImage>;

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

function newBitImage(pixels: usize, width: u32, height: u32): BitImage {
  const bitImage = arena.alloc();
  bitImage.init(pixels, width, height);
  return bitImage;
}

function newBitImageArray(size: u32): usize {
  const ptrsArr = alloc(size * BitImage.size);
  return ptrsArr;
}

function delBitImageArray(array: usize): void {
  dealloc(array);
}

function delBitImage(bitImage: BitImage): void {
  arena.dealloc(bitImage);
}

function initBitImage(): void {
  arena = newArena<BitImage>(BITIMAGES_PER_BLOCK);
}

initBitImage();

export { BitImage, newBitImage, delBitImage, newBitImageArray };
