declare function logi(i: i32): void;
declare const heapOffset: usize;

declare function myAssert(c: boolean): void;

/**********************************************************************/

const ALIGN_BITS: u32 = 3;
const ALIGN_SIZE: u32 = 1 << <usize>ALIGN_BITS;
const ALIGN_MASK: u32 = ALIGN_SIZE - 1;
const MAX_SIZE_32: usize = 1 << 30; // 1GB

const HEAP_BASE = (heapOffset + ALIGN_MASK) & ~ALIGN_MASK;
const OFFSET_PTR = HEAP_BASE; // addr of the alloc pointer
const START_OFFSET = (heapOffset + 8 + ALIGN_MASK) & ~ALIGN_MASK; // first alloc addr

function heapAllocGetOffset(): usize {
  return atomic.load<usize>(OFFSET_PTR);
}

function heapAllocSetOffset(curOffset: usize, newOffset: usize): usize {
  return atomic.cmpxchg<usize>(OFFSET_PTR, curOffset, newOffset);
}

function heapAlloc(reqSize: usize): usize {
  myAssert(reqSize > 0);
  myAssert(reqSize <= MAX_SIZE_32);
  let curOffset: usize;
  let top: usize;
  do {
    curOffset = heapAllocGetOffset();
    top = (curOffset + reqSize + ALIGN_MASK) & ~ALIGN_MASK;
    let curPages = memory.size();
    if (top > (<usize>curPages) << 16) {
      let pagesNeeded = ((top - curOffset  + 0xffff) & ~0xffff) >>> 16;
      let pagesWanted = max(curPages, pagesNeeded); // double memory
      if (memory.grow(pagesWanted) < 0) {
        if (memory.grow(pagesNeeded) < 0) {
          logi(curPages);
          unreachable(); // out of memory
        }
      }
    }
  } while (
    atomic.cmpxchg<usize>(OFFSET_PTR, curOffset, top) != curOffset
  );
  return curOffset;
}

function heapAllocInit(): void {
  store<usize>(OFFSET_PTR, START_OFFSET);
}

export { heapAllocInit, heapAllocGetOffset, heapAllocSetOffset, heapAlloc };
