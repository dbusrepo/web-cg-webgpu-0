import { myAssert } from './myAssert';
import { alloc, dealloc } from './memManager';
import { PTR_SIZE, PTR_ALIGN_MASK, SIZE_T, MAX_ALLOC_SIZE, 
         PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask } from './memUtils';
import { logi } from './importVars';

// The arena allocs a block of objects. Free objects are linked in a free list
// Pointers in the free list are stored at the beginning of object memory, each
// object is aligned to the ptr size, sizeof(RAW_PTR)

@final @unmanaged class ArenaAlloc {

  private _blockPtr: PTR_T; // block ptr
  private _nextPtr: PTR_T; // next allocation in block
  private _freePtr: PTR_T; // free list head ptr
  private _numLeft: SIZE_T; // number of remaining allocable objs in cur block
  private _numPerBlock: SIZE_T; // number of allocable objs per block
  private _blockSize: SIZE_T; // tot bytes allocated per block
  private _objSize: SIZE_T; // total bytes (obj+align pad) per obj, obj are aligned

  // private constructor() { 
  //   this._blockPtr = NULL_PTR;
  //   this._freePtr = NULL_PTR;
  //   this._nextPtr = NULL_PTR;
  //   this._blockSize = 0;
  //   this._objSize = 0;
  //   this._numPerBlock = 0;
  //   this._numLeft = 0;
  // }

  constructor(allocPtr: PTR_T, objSize: SIZE_T, numElementsPerBlock: u32) {
    myAssert(objSize > 0);
    myAssert(numElementsPerBlock > 0);
    const arena = changetype<ArenaAlloc>(allocPtr);
    const minObjSize = max(objSize, PTR_SIZE);
    const objSizeAlign = minObjSize + PTR_ALIGN_MASK;
    const blockSize = (objSizeAlign * numElementsPerBlock) + PTR_ALIGN_MASK;
    myAssert(objSizeAlign <= MAX_ALLOC_SIZE);
    arena._blockSize = blockSize;
    arena._objSize = objSizeAlign;
    arena._numPerBlock = numElementsPerBlock;
    arena._blockPtr = NULL_PTR;
    arena._freePtr = NULL_PTR;
    arena._nextPtr = NULL_PTR;
    arena._numLeft = 0;
    return arena;
  }

  @inline private allocBlock(): void {
    // TODO the previous block is lost...
    this._blockPtr = alloc(this._blockSize);
    this._nextPtr = (this._blockPtr + PTR_ALIGN_MASK) & ~PTR_ALIGN_MASK;
    this._numLeft = this._numPerBlock;
  }

  public alloc(): PTR_T {
    let dataPtr: PTR_T;
    if (this._freePtr != NULL_PTR) {
      dataPtr = this._freePtr;
      this._freePtr = load<PTR_T>(this._freePtr);
      myAssert(this._freePtr == NULL_PTR || (this._freePtr & PTR_ALIGN_MASK) == 0);
    } else {
      if (this._numLeft == 0) {
        this.allocBlock();
      }
      myAssert(this._numLeft > 0 && this._nextPtr !== NULL_PTR);
      dataPtr = (this._nextPtr + PTR_ALIGN_MASK) & ~PTR_ALIGN_MASK;
      this._nextPtr += this._objSize;
      this._numLeft--;
    }
    myAssert((dataPtr & PTR_ALIGN_MASK) == 0);
    return dataPtr;
  }

  @inline public dealloc(ptr: PTR_T): void {
    if (ptr != NULL_PTR) {
      myAssert((ptr & PTR_ALIGN_MASK) == 0); // add other checks ?
      store<PTR_T>(ptr, this._freePtr);
      this._freePtr = ptr;
    }
  }

}

function newArena(objSize: SIZE_T, numElementsPerBlock: u32): ArenaAlloc {
  const arenaSize = getTypeSize<ArenaAlloc>();
  const ptr: PTR_T = alloc(arenaSize);
  const arena = new ArenaAlloc(ptr, objSize, numElementsPerBlock);
  return arena;
}

export { ArenaAlloc, newArena };
