import { myAssert } from './myAssert';
import { lock, unlock } from './mutex';
import { logi, heapOffset } from './importVars';
import { NULL, MAX_ALLOC_SIZE } from './common';

/**********************************************************************/

const ALIGN_BITS = <i32>sizeof<usize>();
const ALIGN_SIZE: u32 = 1 << ALIGN_BITS;
const ALIGN_MASK: u32 = ALIGN_SIZE - 1;

const HEAP_BASE = heapOffset;
const MUTEX_PTR = (heapOffset + 3) & ~3; // align to 4 bytes
const ALLOC_PTR_PTR = (MUTEX_PTR + 4 + ALIGN_MASK) & ~ALIGN_MASK; // after the mutex, align to X bytes
const FREE_PTR_PTR = ALLOC_PTR_PTR + ALIGN_SIZE; // after the offset pointer, the free list ptr
const START_ALLOC_PTR = FREE_PTR_PTR  + ALIGN_SIZE; // after the free block ptr ptr, the alloc area

// each block has an header with the size stored before the data, the rest
// is 'shared' with the data but used only when the block is unused/in the free
// list
class Block {
  size: u32; // stored before data
  next: usize; // stored with data, so alloc size >= sizeof(usize)
}

const BLOCK_USAGE_BIT_POS = 31;
const BLOCK_USAGE_BIT_MASK = 1 << BLOCK_USAGE_BIT_POS;

const HEADER_SIZE: u32 = sizeof<u32>(); // size field
const BLOCK_SIZE: u32 = offsetof<Block>();

function setBlockUsed(blockPtr: usize): void {
  const block = changetype<Block>(blockPtr);
  block.size |= BLOCK_USAGE_BIT_MASK;
}

function setBlockUnused(blockPtr: usize): void {
  const block = changetype<Block>(blockPtr);
  block.size &= ~BLOCK_USAGE_BIT_MASK;
}

function isBlockUsed(blockPtr: usize): boolean {
  const block = changetype<Block>(blockPtr);
  return (block.size & BLOCK_USAGE_BIT_MASK) !== 0;
}

function setBlockSize(blockPtr: usize, size: u32): void {
  const block = changetype<Block>(blockPtr);
  const usageBit = block.size & BLOCK_USAGE_BIT_MASK;
  myAssert(size <= MAX_ALLOC_SIZE);
  block.size = usageBit | size;
}

function getBlockSize(blockPtr: usize): u32 {
  const block = changetype<Block>(blockPtr);
  return block.size & ~BLOCK_USAGE_BIT_MASK;
}

function atomicGetAllocPtr(): usize {
  return atomic.load<usize>(ALLOC_PTR_PTR);
}

function heapAllocSetOffset(curOffset: usize, newOffset: usize): usize {
  return atomic.cmpxchg<usize>(ALLOC_PTR_PTR, curOffset, newOffset);
}

// thread safe?
function checkGrowMemory(curOffset: usize, nextOffset: usize): void {
  let curPages = memory.size();
  if (nextOffset > (<usize>curPages) << 16) {
    let pagesNeeded = <i32>(((nextOffset - curOffset  + 0xffff) & ~0xffff) >>> 16);
    let pagesWanted = <i32>max(curPages, pagesNeeded); // double memory
    if (memory.grow(pagesWanted) < 0) {
      if (memory.grow(pagesNeeded) < 0) {
        // logi(curPages);
        unreachable(); // out of memory
      }
    }
  }
}

function allocNewBlock(reqSize: u32): usize {
  let curOffset: usize;
  let newOffset: usize;
  let blockPtr: usize;
  let dataSize: u32;
  do {
    curOffset = atomicGetAllocPtr();
    // align data (and the block next field)
    blockPtr = ((curOffset + HEADER_SIZE + ALIGN_MASK) & ~ALIGN_MASK) - HEADER_SIZE;
    dataSize = max(BLOCK_SIZE - HEADER_SIZE, reqSize);
    newOffset = blockPtr + HEADER_SIZE + dataSize;
    checkGrowMemory(curOffset, newOffset);
  } while (
    heapAllocSetOffset(curOffset, newOffset) != curOffset
  );
  setBlockUsed(blockPtr);
  setBlockSize(blockPtr, dataSize);
  let dataPtr = blockPtr + HEADER_SIZE;
  return dataPtr;
}

function searchFreeList(reqSize: u32): usize {
  let blockPtrPtr = FREE_PTR_PTR;
  let blockPtr = atomic.load<usize>(blockPtrPtr);
  while (blockPtr != NULL) {
    const block = changetype<Block>(blockPtr);
    const size = block.size;
    if (size >= reqSize) {
      break;
    }
    blockPtrPtr = blockPtr + HEADER_SIZE;
    blockPtr = atomic.load<usize>(blockPtrPtr);
  }
  return blockPtrPtr;
}

function heapAlloc(reqSize: u32): usize {
  myAssert(reqSize > 0);
  myAssert(reqSize <= MAX_ALLOC_SIZE);
  let dataPtr: usize = NULL;
  const freePtr = atomic.load<usize>(FREE_PTR_PTR);
  if (freePtr != NULL) {
    // search+remove from free list: coarse gain sync, assume low contention...
    lock(MUTEX_PTR);
    const prevPtrPtr = searchFreeList(reqSize);
    let blockPtr = atomic.load<usize>(prevPtrPtr);
    if (blockPtr != NULL) {
      myAssert(!isBlockUsed(blockPtr));
      setBlockUsed(blockPtr);
      dataPtr = blockPtr + HEADER_SIZE;
      const nextPtr = atomic.load<usize>(dataPtr);
      atomic.store<usize>(prevPtrPtr, nextPtr);
    }
    unlock(MUTEX_PTR);
  }
  if (dataPtr == NULL) {
    dataPtr = allocNewBlock(reqSize);
  }
  return dataPtr;
}

function heapDealloc(dataPtr: usize): void {
  lock(MUTEX_PTR);
  const blockPtr = dataPtr - HEADER_SIZE;
  myAssert(isBlockUsed(blockPtr));
  setBlockUnused(blockPtr);
  const freePtr = atomic.load<usize>(FREE_PTR_PTR);
  atomic.store<usize>(dataPtr, freePtr);
  atomic.store<usize>(FREE_PTR_PTR, blockPtr);
  unlock(MUTEX_PTR);
}

function heapAllocInit(): void {
  // logi(START_ALLOC_PTR);
  store<usize>(ALLOC_PTR_PTR, START_ALLOC_PTR);
  store<usize>(FREE_PTR_PTR, NULL);
}

export { heapAllocInit, heapAlloc, heapDealloc };
