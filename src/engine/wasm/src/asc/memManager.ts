import { myAssert } from './myAssert';
import { heapAlloc, heapDealloc } from './heapAlloc';
import { logi, workerIdx, workersHeapOffset, workerHeapSize } from './importVars';
import { MEM_BLOCK_USAGE_BIT_MASK, SIZE_T, MAX_ALLOC_SIZE, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, } from './memUtils';

// Mem mananger: worker (private) heap mem handling:
// list of blocks
// uses the shared heap (see heapAlloc) when no blocks are available

const WORKER_HEAP_BASE: PTR_T = workersHeapOffset + workerIdx * workerHeapSize;
const WORKER_HEAP_LIMIT: PTR_T = WORKER_HEAP_BASE + workerHeapSize;

let freeBlockPtr = WORKER_HEAP_BASE;

class Block {
  size: SIZE_T;
}

const H_SIZE = getTypeSize<HeaderBlock>();
const F_SIZE = getTypeSize<FooterBlock>();
const HF_SIZE = H_SIZE + F_SIZE;

class HeaderBlock extends Block {
  next: PTR_T;
  prev: PTR_T;
}

class FooterBlock extends Block {}

@inline function setBlockUsed(blockPtr: PTR_T): void {
  const block = changetype<Block>(blockPtr);
  block.size |= MEM_BLOCK_USAGE_BIT_MASK;
}

@inline function setBlockUnused(blockPtr: PTR_T): void {
  const block = changetype<Block>(blockPtr);
  block.size &= ~MEM_BLOCK_USAGE_BIT_MASK;
}

@inline function isBlockUsed(blockPtr: PTR_T): boolean {
  const block = changetype<Block>(blockPtr);
  return (block.size & MEM_BLOCK_USAGE_BIT_MASK) !== 0;
}

@inline function setBlockSize(blockPtr: PTR_T, size: SIZE_T): void {
  const block = changetype<Block>(blockPtr);
  const usageBit = block.size & MEM_BLOCK_USAGE_BIT_MASK;
  myAssert(size <= MAX_ALLOC_SIZE);
  block.size = usageBit | size;
}

@inline function getBlockSize(blockPtr: PTR_T): SIZE_T {
  const block = changetype<Block>(blockPtr);
  return block.size & ~MEM_BLOCK_USAGE_BIT_MASK;
}

function searchFirstFit(reqSize: SIZE_T): PTR_T {
  if (freeBlockPtr == NULL_PTR) {
    return NULL_PTR;
  }
  let found = false;
  let ptr = freeBlockPtr;
  do {
    if (getBlockSize(ptr) - HF_SIZE >= reqSize) {
      found = true;
    } else {
      ptr = changetype<HeaderBlock>(ptr).next;
    }
  } while (!found && ptr != freeBlockPtr);
  return found ? ptr : NULL_PTR;
}

// remove node from the free list or subst it with newNode if newNode is not null
function replaceNode(nodePtr: PTR_T, newNodePtr: PTR_T = NULL_PTR): void {
  myAssert(nodePtr != NULL_PTR);
  const node = changetype<HeaderBlock>(nodePtr);
  const single = (node.next == nodePtr);
  if (single) {
    myAssert(freeBlockPtr == nodePtr);
    if (newNodePtr != NULL_PTR) {
      const newNode = changetype<HeaderBlock>(newNodePtr);
      freeBlockPtr = newNode.prev = newNode.next = newNodePtr;
    } else {
      freeBlockPtr = NULL_PTR;
    }
  } else {
    const prevNext = newNodePtr != NULL_PTR ? newNodePtr : node.next;
    const nextPrev = newNodePtr != NULL_PTR ? newNodePtr : node.prev;
    changetype<HeaderBlock>(node.prev).next = prevNext;
    changetype<HeaderBlock>(node.next).prev = nextPrev;
    if (nodePtr == freeBlockPtr) {
      freeBlockPtr = prevNext;
    }
    if (newNodePtr != NULL_PTR) {
      const newNode = changetype<HeaderBlock>(newNodePtr);
      newNode.prev = node.prev;
      newNode.next = node.next;
    }
  }
  node.next = node.prev = NULL_PTR;
}

function alloc(reqSize: SIZE_T): PTR_T {
  // print();
  // logi(reqSize);
  myAssert(reqSize > 0);
  myAssert(reqSize <= MAX_ALLOC_SIZE);
  // return heapAlloc(reqSize); // TODO REMOVE
  const headerPtr = searchFirstFit(reqSize);
  if (headerPtr == NULL_PTR) {
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

function dealloc(ptr: PTR_T): void {
  myAssert(ptr != NULL_PTR);
  if (ptr >= WORKER_HEAP_LIMIT) {
    return heapDealloc(ptr);
  }
  myAssert(ptr >= WORKER_HEAP_BASE + H_SIZE &&  ptr < WORKER_HEAP_LIMIT - F_SIZE);
  let headerPtr = ptr - H_SIZE;
  myAssert(isBlockUsed(headerPtr));
  let blockSize = getBlockSize(headerPtr);
  myAssert(blockSize > 0);
  const footerPtr = headerPtr + blockSize - F_SIZE;
  myAssert(isBlockUsed(footerPtr));
  setBlockUnused(headerPtr);
  setBlockUnused(footerPtr);

  let header = changetype<HeaderBlock>(headerPtr);
  if (freeBlockPtr == NULL_PTR) {
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
  if (freeBlockPtr == NULL_PTR) {
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

function initMemManager(): void {

  // print();

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

// pre: ptr != NULL_PTR
@inline function assertPtrLowerBound(ptr: PTR_T): void {
  myAssert(ptr >= WORKER_HEAP_BASE + H_SIZE);
}

// function print(): void {
//   logi(workerIdx);
//   logi(workersHeapOffset);
//   logi(WORKER_HEAP_BASE);
//   logi(WORKER_HEAP_LIMIT);
// }

export { initMemManager, alloc, dealloc, assertPtrLowerBound };
