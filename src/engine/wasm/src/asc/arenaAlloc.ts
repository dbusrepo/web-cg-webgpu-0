import { myAssert } from './myAssert';
import { alloc, dealloc } from './workerHeapAlloc';
import { NULL, MAX_ALLOC_SIZE } from './common';
import { logi } from './importVars';

class ArenaAlloc<T> {

  private static readonly PTR_SIZE: usize = sizeof<usize>();

  private static ALIGN_SIZE: u32 = <u32>ArenaAlloc.PTR_SIZE;
  private static ALIGN_MASK: u32 = ArenaAlloc.ALIGN_SIZE - 1;

  private blockSize: u32; // tot bytes allocated per block
  private allocSize: u32; // total bytes (obj+align pad) per obj, obj are aligned
  private numElementsPerBlock: u32; // number of allocable objs per block
  private block: usize = NULL; // block ptr
  private blockPos: u32; // pos next allocation in block
  private sizeLeft: u32; // number of remaining allocable objs in cur block
  private freePtr: usize = NULL; // free list head ptr

  private constructor() {}

  public init(numElementsPerBlock: u32): void {
    const objSize = offsetof<T>();
    this.allocSize = max(objSize, ArenaAlloc.PTR_SIZE);
    // round alloc size to align size
    this.allocSize = (this.allocSize + ArenaAlloc.ALIGN_MASK) & (~ArenaAlloc.ALIGN_MASK);
    // add align mask to block size to align first obj...
    this.blockSize = (this.allocSize * numElementsPerBlock) + ArenaAlloc.ALIGN_MASK;
    myAssert(this.blockSize <= MAX_ALLOC_SIZE);
    this.numElementsPerBlock = numElementsPerBlock;
  }

  private allocBlock(): void {
    // TODO the previous block is lost...
    this.block = alloc(this.blockSize);
    this.blockPos = <u32>(this.block + ArenaAlloc.ALIGN_MASK) & (~ArenaAlloc.ALIGN_MASK)
    this.sizeLeft = this.numElementsPerBlock;
  }

  public alloc(): T {
    let dataPtr: usize;
    if (this.freePtr != NULL) {
      dataPtr = this.freePtr;
      this.freePtr = load<usize>(this.freePtr);
    } else {
      if (this.block == NULL || this.sizeLeft == 0) {
        this.allocBlock();
      }
      this.sizeLeft--;
      dataPtr = this.blockPos;
      this.blockPos += this.allocSize;
    }
    myAssert(dataPtr % ArenaAlloc.ALIGN_SIZE == 0);
    return changetype<T>(dataPtr);
  }

  public dealloc(v: T): void {
    const ptr = changetype<usize>(v);
    store<usize>(ptr, this.freePtr);
    this.freePtr = ptr;
  }

}

function newArena<T>(numElementsPerBlock: u32): ArenaAlloc<T> {
  const arenaObjSize = <u32>offsetof<ArenaAlloc<T>>();
  const ptr: usize = alloc(arenaObjSize);
  const arena = changetype<ArenaAlloc<T>>(ptr);
  arena.init(numElementsPerBlock);
  return arena;
}

export { ArenaAlloc, newArena };
