// env
declare function logi(i: i32): void;

declare const workerIdx: u32;
declare const workersHeapOffset: usize;
declare const workerHeapSize: u32;

// myAssert
declare function myAssert(c: boolean): void;

// heapAlloc
declare function heapAlloc(reqSize: usize): usize;

/**********************************************************************/

const HEAP_SIZE: u32 = workerHeapSize;
const HEAP_BASE: usize = workersHeapOffset + workerIdx * HEAP_SIZE;
const HEAP_LIMIT: usize = HEAP_BASE + workerHeapSize;

const MAX_SIZE_32: u32 = 1 << 30; // 1GB

class Block {
  size: u32 // bit 31 in field 'size' is the used flag
}

const BLOCK_USAGE_BIT_POS = 31;
const BLOCK_USAGE_BIT_MASK = 1 << BLOCK_USAGE_BIT_POS;

class HeaderBlock extends Block {
  next: usize;
  prev: usize;
}

class FooterBlock extends Block {}

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
  myAssert(size <= MAX_SIZE_32);
  block.size = usageBit | size;
}

function getBlockSize(blockPtr: usize): u32 {
  const block = changetype<Block>(blockPtr);
  return block.size & ~BLOCK_USAGE_BIT_MASK;
}

const NULL: usize = 0;
const H_SIZE: u32 = offsetof<HeaderBlock>();
const F_SIZE: u32 = offsetof<FooterBlock>();
const HF_SIZE = H_SIZE + F_SIZE;

let freeBlockPtr = HEAP_BASE;

function print(): void {
  logi(workerIdx);
  logi(workersHeapOffset);
  logi(HEAP_BASE);
  logi(HEAP_LIMIT);
}

function allocInit(): void {
  print();
  const headerPtr = HEAP_BASE;
  setBlockUnused(headerPtr);
  setBlockSize(headerPtr, HEAP_SIZE);

  const footerPtr = HEAP_LIMIT - F_SIZE;
  setBlockUnused(footerPtr);
  setBlockSize(footerPtr, HEAP_SIZE);

  // free list of blocks as a doubly linked cyclic list
  const header = changetype<HeaderBlock>(headerPtr);
  header.next = header.prev = headerPtr;
}

function searchFirstFit(reqSize: u32): usize {
  if (freeBlockPtr == NULL) {
    return NULL;
  }
  let found: boolean = false;
  let ptr = freeBlockPtr;
  do {
    if (getBlockSize(ptr) - HF_SIZE >= reqSize) {
      found = true;
    } else {
      ptr = changetype<HeaderBlock>(ptr).next;
    }
  } while (!found && ptr != freeBlockPtr);
  return found ? ptr : NULL;
}

function detachBlockFromFreeList(headerPtr: usize): void {
  const header = changetype<HeaderBlock>(headerPtr);
  if (header.next == headerPtr) {
    myAssert(freeBlockPtr == headerPtr);
    freeBlockPtr = NULL;
  } else {
    changetype<HeaderBlock>(header.prev).next = header.next;
    changetype<HeaderBlock>(header.next).prev = header.prev;
    if (headerPtr == freeBlockPtr) {
      freeBlockPtr = header.next;
    }
  }
}

function alloc(reqSize: u32): usize {
  // print();
  myAssert(reqSize > 0);
  myAssert(reqSize <= MAX_SIZE_32);
  const headerPtr = searchFirstFit(reqSize);
  if (headerPtr == NULL) {
    // compaction ? no...we alloc from the shared heap...
    // logi(-1);
    return heapAlloc(reqSize);
  }
  myAssert(!isBlockUsed(headerPtr));
  const header = changetype<HeaderBlock>(headerPtr);
  const blockSize = getBlockSize(headerPtr);
  const footerPtr = headerPtr + blockSize - F_SIZE;
  const footer = changetype<FooterBlock>(footerPtr);
  const allocated = headerPtr + H_SIZE;
  const exactFit: boolean = blockSize == (reqSize - HF_SIZE);
  const splitBlock: boolean = blockSize >= (reqSize + 2 * HF_SIZE);
  if (exactFit || !splitBlock) {
    setBlockUsed(headerPtr);
    setBlockUsed(footerPtr);
    detachBlockFromFreeList(headerPtr);
  } else {
    const usedHeaderPtr = headerPtr;
    const usedFooterPtr = headerPtr + H_SIZE + reqSize;
    const freeHeaderPtr = usedFooterPtr + F_SIZE;
    const freeFooterPtr = footerPtr;
    setBlockUsed(usedHeaderPtr);
    setBlockUsed(usedFooterPtr);
    setBlockUnused(freeHeaderPtr);
    setBlockUnused(freeFooterPtr);
    // const usedHeader = changetype<HeaderBlock>(usedHeaderPtr);
    // const usedFooter = changetype<FooterBlock>(usedFooterPtr);
    const usedSize = reqSize + HF_SIZE;
    setBlockSize(usedHeaderPtr, usedSize);
    setBlockSize(usedFooterPtr, usedSize);
    setBlockSize(freeHeaderPtr, blockSize - usedSize);
    setBlockSize(freeFooterPtr, blockSize - usedSize);
    const freeHeader = changetype<HeaderBlock>(freeHeaderPtr);
    // const freeFooter = changetype<HeaderBlock>(freeFooterPtr);
    if (header.next == headerPtr) {
      myAssert(freeBlockPtr == headerPtr);
      freeHeader.prev = freeHeader.next = freeHeaderPtr;
      freeBlockPtr = freeHeaderPtr;
    } else {
      freeHeader.prev = header.prev;
      freeHeader.next = header.next;
      changetype<HeaderBlock>(header.prev).next = freeHeaderPtr;
      changetype<HeaderBlock>(header.next).prev = freeHeaderPtr;
      if (headerPtr == freeBlockPtr) {
        freeBlockPtr = freeHeaderPtr;
      }
    }
  }
  return allocated;
}

function dealloc(dataPtr: usize): void {
  myAssert(false); // TODO add check addr heap !
  myAssert(dataPtr >= HEAP_SIZE + H_SIZE &&  dataPtr < HEAP_LIMIT - F_SIZE);
  let headerPtr = dataPtr - H_SIZE;
  myAssert(isBlockUsed(headerPtr));
  let blockSize = getBlockSize(headerPtr);
  myAssert(blockSize > 0);
  const footerPtr = headerPtr + blockSize - F_SIZE;
  myAssert(isBlockUsed(footerPtr));
  setBlockUnused(headerPtr);
  setBlockUnused(footerPtr);

  let header = changetype<HeaderBlock>(headerPtr);
  if (freeBlockPtr == NULL) {
    header.next = header.prev = headerPtr;
    freeBlockPtr = headerPtr;
    return;
  }

  // const footer = changetype<FooterBlock>(footerPtr);

  // check if the left memory adjacent neighbor is free, if so coalesce the two
  // blocks
  const leftFooterPtr = headerPtr - F_SIZE;
  if (leftFooterPtr >= HEAP_BASE && !isBlockUsed(leftFooterPtr)) {
    // const leftFooter = changetype<FooterBlock>(leftFooterPtr);
    const leftBlockSize = getBlockSize(leftFooterPtr);
    const leftHeaderPtr = headerPtr - leftBlockSize;
    myAssert(leftHeaderPtr >= HEAP_BASE);
    const leftHeader = changetype<HeaderBlock>(leftHeaderPtr);

    const coalesceSize = leftBlockSize + blockSize;
    setBlockSize(leftHeaderPtr, coalesceSize);
    setBlockSize(footerPtr, coalesceSize);

    if (leftHeader.next == leftHeaderPtr) {
      // this block is the only free one remaining on the free list
      myAssert(leftHeader.prev == leftHeaderPtr);
      myAssert(leftHeaderPtr == freeBlockPtr);
      return;
    }
    // remove the coalesced block from the free list. This makes the current
    // block appear to be used, which sets up for coalescing with the right
    // block and/or for adding the coalesced block back to the free list
    headerPtr = leftHeaderPtr;
    header = leftHeader;
    changetype<HeaderBlock>(header.prev).next = header.next;
    changetype<HeaderBlock>(header.next).prev = header.prev;
    blockSize = coalesceSize;
  }
  
  const rightHeaderPtr = headerPtr + blockSize;
  if (rightHeaderPtr < HEAP_LIMIT && !isBlockUsed(rightHeaderPtr)) {
    const rightHeader = changetype<HeaderBlock>(rightHeaderPtr);
    const rightSize = getBlockSize(rightHeaderPtr);
    myAssert(rightHeaderPtr + rightSize <= HEAP_LIMIT);
    const rightFooterPtr = rightHeaderPtr + rightSize - F_SIZE;
    // const rightFooter = changetype<FooterBlock>(rightFooterPtr);

    const coalesceSize = blockSize + rightSize;
    setBlockSize(headerPtr, coalesceSize);
    setBlockSize(rightFooterPtr, coalesceSize);

    if (rightHeader.next == rightHeaderPtr) {
      myAssert(rightHeader.prev == rightHeaderPtr);
      myAssert(rightHeaderPtr == freeBlockPtr);
      // the right block is the only one remaining on the free list, we remove
      // it and add the coalesced block
      header.next = header.prev = headerPtr;
      freeBlockPtr = headerPtr;
      return;
    }
    // remove the right block from the free list
    changetype<HeaderBlock>(rightHeader.prev).next = rightHeader.next;
    changetype<HeaderBlock>(rightHeader.next).prev = rightHeader.prev;
  }

  // add header block to the free list
  const freeBlock = changetype<HeaderBlock>(freeBlockPtr);
  changetype<HeaderBlock>(freeBlock.prev).next = headerPtr;
  header.prev = freeBlock.prev;
  header.next = freeBlockPtr;
  freeBlock.prev = headerPtr;
  freeBlockPtr = headerPtr;
  // logi(freeBlockPtr);
}

allocInit(); // for each worker/module

export { allocInit, alloc, dealloc };
