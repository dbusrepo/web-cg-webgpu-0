// env
declare function logi(i: i32): void;

declare const workerIdx: u32;
declare const workersHeapOffset: usize;
declare const workerHeapSize: u32;

// myAssert
declare function myAssert(c: boolean): void;

// heapAlloc
declare function heapAlloc(reqSize: usize): usize;
declare function heapDealloc(dataPtr: usize): void;

/**********************************************************************/

const WORKER_HEAP_BASE: usize = workersHeapOffset + workerIdx * workerHeapSize;
const WORKER_HEAP_LIMIT: usize = WORKER_HEAP_BASE + workerHeapSize;

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

@inline
function setBlockUsed(blockPtr: usize): void {
  const block = changetype<Block>(blockPtr);
  block.size |= BLOCK_USAGE_BIT_MASK;
}

@inline
function setBlockUnused(blockPtr: usize): void {
  const block = changetype<Block>(blockPtr);
  block.size &= ~BLOCK_USAGE_BIT_MASK;
}

@inline
function isBlockUsed(blockPtr: usize): boolean {
  const block = changetype<Block>(blockPtr);
  return (block.size & BLOCK_USAGE_BIT_MASK) !== 0;
}

@inline
function setBlockSize(blockPtr: usize, size: u32): void {
  const block = changetype<Block>(blockPtr);
  const usageBit = block.size & BLOCK_USAGE_BIT_MASK;
  myAssert(size <= MAX_SIZE_32);
  block.size = usageBit | size;
}

@inline
function getBlockSize(blockPtr: usize): u32 {
  const block = changetype<Block>(blockPtr);
  return block.size & ~BLOCK_USAGE_BIT_MASK;
}

const NULL: usize = 0;
const H_SIZE: u32 = offsetof<HeaderBlock>();
const F_SIZE: u32 = offsetof<FooterBlock>();
const HF_SIZE = H_SIZE + F_SIZE;

let freeBlockPtr = WORKER_HEAP_BASE;

function print(): void {
  logi(workerIdx);
  logi(workersHeapOffset);
  logi(WORKER_HEAP_BASE);
  logi(WORKER_HEAP_LIMIT);
}

function allocInit(): void {
  print();
  const headerPtr = WORKER_HEAP_BASE;
  setBlockUnused(headerPtr);
  setBlockSize(headerPtr, workerHeapSize);

  const footerPtr = WORKER_HEAP_LIMIT - F_SIZE;
  setBlockUnused(footerPtr);
  setBlockSize(footerPtr, workerHeapSize);

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

// remove node from the free list or subst it with newNode if newNode != NULL
function replaceNode(nodePtr: usize, newNodePtr: usize = NULL): void {
  myAssert(nodePtr != NULL);
  const node = changetype<HeaderBlock>(nodePtr);
  const single = node.next == nodePtr;
  if (single) {
    myAssert(freeBlockPtr == nodePtr);
    if (newNodePtr != NULL) {
      const newNode = changetype<HeaderBlock>(newNodePtr);
      freeBlockPtr = newNode.prev = newNode.next = newNodePtr;
    } else {
      freeBlockPtr = NULL;
    }
  } else {
    const prevNext = newNodePtr != NULL ? newNodePtr : node.next;
    const nextPrev = newNodePtr != NULL ? newNodePtr : node.prev;
    changetype<HeaderBlock>(node.prev).next = prevNext;
    changetype<HeaderBlock>(node.next).prev = nextPrev;
    if (nodePtr == freeBlockPtr) {
      freeBlockPtr = prevNext;
    }
    if (newNodePtr != NULL) {
      const newNode = changetype<HeaderBlock>(newNodePtr);
      newNode.prev = node.prev;
      newNode.next = node.next;
    }
  }
  node.next = node.prev = NULL;
}

function alloc(reqSize: u32): usize {
  // print();
  myAssert(reqSize > 0);
  myAssert(reqSize <= MAX_SIZE_32);
  // return heapAlloc(reqSize); // TODO REMOVE
  const headerPtr = searchFirstFit(reqSize);
  if (headerPtr == NULL) {
    // compaction ? no...we alloc from the shared heap...
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
    replaceNode(headerPtr);
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
    // const freeFooter = changetype<HeaderBlock>(freeFooterPtr);
    replaceNode(headerPtr, freeHeaderPtr);
  }
  return allocated;
}

function dealloc(dataPtr: usize): void {
  myAssert(dataPtr != NULL);
  if (dataPtr >= WORKER_HEAP_LIMIT) {
    return heapDealloc(dataPtr);
  }
  myAssert(dataPtr >= WORKER_HEAP_BASE + H_SIZE &&  dataPtr < WORKER_HEAP_LIMIT - F_SIZE);
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

  // coalesce with the left neightbor if unused
  const leftFooterPtr = headerPtr - F_SIZE;
  if (leftFooterPtr >= WORKER_HEAP_BASE && !isBlockUsed(leftFooterPtr)) {
    const leftBlockSize = getBlockSize(leftFooterPtr);
    const leftHeaderPtr = headerPtr - leftBlockSize;
    myAssert(leftHeaderPtr >= WORKER_HEAP_BASE);
    const leftHeader = changetype<HeaderBlock>(leftHeaderPtr);

    blockSize += leftBlockSize;
    setBlockSize(leftHeaderPtr, blockSize);
    setBlockSize(footerPtr, blockSize);

    // remove the coalesced block from the free list. This makes the current
    // block appear to be used, which sets up for coalescing with the right
    // block and/or for adding the coalesced block back to the free list
    replaceNode(leftHeaderPtr);
    headerPtr = leftHeaderPtr;
    header = leftHeader;
  }
  
  // coalesce with the right neightbor if unused
  const rightHeaderPtr = headerPtr + blockSize;
  if (rightHeaderPtr < WORKER_HEAP_LIMIT && !isBlockUsed(rightHeaderPtr)) {
    const rightHeader = changetype<HeaderBlock>(rightHeaderPtr);
    const rightSize = getBlockSize(rightHeaderPtr);
    myAssert(rightHeaderPtr + rightSize <= WORKER_HEAP_LIMIT);
    const rightFooterPtr = rightHeaderPtr + rightSize - F_SIZE;
    // const rightFooter = changetype<FooterBlock>(rightFooterPtr);

    blockSize += rightSize;
    setBlockSize(headerPtr, blockSize);
    setBlockSize(rightFooterPtr, blockSize);

    // remove the right block from the free list
    replaceNode(rightHeaderPtr);
  }

  // add the free (coalesced) block to the free list
  if (freeBlockPtr == NULL) {
    header.next = header.prev = headerPtr;
  } else {
    const freeBlock = changetype<HeaderBlock>(freeBlockPtr);
    header.prev = freeBlock.prev;
    header.next = freeBlockPtr;
    changetype<HeaderBlock>(freeBlock.prev).next = headerPtr;
    freeBlock.prev = headerPtr;
  }
  freeBlockPtr = headerPtr;
  // logi(freeBlockPtr);
  // logi(getBlockSize(freeBlockPtr));
}

allocInit(); // for each worker/module

export { allocInit, alloc, dealloc };
