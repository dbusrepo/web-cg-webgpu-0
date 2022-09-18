import { myAssert } from './myAssert';
import { alloc, dealloc } from './workerHeapAlloc';
import { MAX_ALLOC_SIZE } from './common';
import { logi } from './importVars';

class ArenaAlloc {

  private static readonly PTR_SIZE: u32 = sizeof<usize>();

  private static ALIGN_SIZE: u32 = (1 << alignof<usize>());
  private static ALIGN_MASK: u32 = ArenaAlloc.ALIGN_SIZE - 1;

  private blockSize: u32; // tot bytes allocated per block
  private allocSize: u32; // total bytes (obj+align pad) per obj, obj are aligned
  private numElementsPerBlock: u32; // number of allocable objs per block
  private block: usize = 0; // block ptr
  private nextPtr: usize; // pos next allocation in block
  private sizeLeft: u32; // number of remaining allocable objs in cur block
  private freePtr: usize = 0; // free list head ptr

  private constructor() {}

  public init(objSize: u32, numElementsPerBlock: u32): void {
    this.allocSize = max(objSize, ArenaAlloc.PTR_SIZE);
    // round alloc size to align size
    this.allocSize = (this.allocSize + ArenaAlloc.ALIGN_MASK) & (~ArenaAlloc.ALIGN_MASK);
    // add align mask to block size to align first obj...
    this.blockSize = (this.allocSize * numElementsPerBlock) + ArenaAlloc.ALIGN_MASK;
    // logi(this.blockSize);
    myAssert(this.blockSize <= MAX_ALLOC_SIZE);
    this.numElementsPerBlock = numElementsPerBlock;
  }

  private allocBlock(): void {
    // TODO the previous block is lost...
    this.block = alloc(this.blockSize);
    this.nextPtr = (this.block + ArenaAlloc.ALIGN_MASK) & (~ArenaAlloc.ALIGN_MASK)
    this.sizeLeft = this.numElementsPerBlock;
  }

  public alloc(): usize {
    // logi(changetype<u32>(this));
    // logi(-3);
    let dataPtr: usize;
    if (this.freePtr != 0) {
      dataPtr = this.freePtr;
      this.freePtr = load<usize>(this.freePtr);
    } else {
      if (this.block == 0 || this.sizeLeft == 0) {
        this.allocBlock();
      }
      this.sizeLeft--;
      dataPtr = this.nextPtr;
      this.nextPtr += this.allocSize;
    }
    myAssert(dataPtr % ArenaAlloc.ALIGN_SIZE == 0);
    return dataPtr;
  }

  public dealloc(ptr: usize): void {
    store<usize>(ptr, this.freePtr);
    this.freePtr = ptr;
  }

}

function newArena(objSize: u32, numElementsPerBlock: u32): ArenaAlloc {
  const arenaObjSize = <u32>offsetof<ArenaAlloc>();
  const ptr: usize = alloc(arenaObjSize);
  const arena = changetype<ArenaAlloc>(ptr);
  arena.init(objSize, numElementsPerBlock);
  return arena;
}

export { ArenaAlloc, newArena };
