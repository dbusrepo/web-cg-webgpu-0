import { myAssert } from './myAssert';
import { alloc, dealloc, assertPtrLowerBound } from './memManager';
import { PTR_SIZE, PTR_ALIGN_MASK, SIZE_T, MAX_ALLOC_SIZE, 
         PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask } from './memUtils';
import { logi } from './importVars';

// The arena allocs blocks of objects. Free objects are linked in a free list
// Pointers in the free list are stored at the beg of the object mem

@final @unmanaged class ArenaAlloc {

  private _blockPtr: PTR_T; // block ptr
  private _nextPtr: PTR_T; // next allocation in block
  private _freePtr: PTR_T; // free list head ptr
  private _numLeft: SIZE_T; // number of remaining allocable objs in cur block
  private _numPerBlock: SIZE_T; // number of allocable objs per block
  private _blockSize: SIZE_T; // tot bytes allocated per block
  private _objSize: SIZE_T; // total bytes (obj+align pad) per obj, obj are aligned
  private _alignMask: SIZE_T; // objects align mask

  private constructor() { 
    this._blockPtr = NULL_PTR;
    this._freePtr = NULL_PTR;
    this._nextPtr = NULL_PTR;
    this._blockSize = 0;
    this._objSize = 0;
    this._numPerBlock = 0;
    this._numLeft = 0;
    this._alignMask = 0;
  }

  init(objSize: SIZE_T, numObjsPerBlock: u32, objAlignLg2: SIZE_T): void {
    myAssert(objSize > 0);
    myAssert(numObjsPerBlock > 0);
    const minObjSize = max(objSize, PTR_SIZE);
    const alignMask: SIZE_T = max(<SIZE_T>(1) << objAlignLg2, PTR_ALIGN_MASK + 1) - 1;
    let objSizeAlign: SIZE_T;
    let blockSize: SIZE_T;
    if ((minObjSize & alignMask) != 0) {
      if (minObjSize < alignMask + 1) {
        objSizeAlign = alignMask + 1;
        blockSize = (objSizeAlign * numObjsPerBlock) + alignMask;
      } else {
        objSizeAlign = minObjSize + alignMask;
        blockSize = objSizeAlign * numObjsPerBlock;
      }
    } else {
      objSizeAlign = minObjSize;
      blockSize = (objSizeAlign * numObjsPerBlock) + alignMask;
    }
    myAssert(objSizeAlign <= MAX_ALLOC_SIZE);
    this._blockSize = blockSize;
    this._objSize = objSizeAlign;
    this._alignMask = alignMask;
    this._numPerBlock = numObjsPerBlock;
    this._blockPtr = NULL_PTR;
    this._freePtr = NULL_PTR;
    this._nextPtr = NULL_PTR;
    this._numLeft = 0;
  }

  @inline private allocBlock(): void {
    // Note: the previous block ptr is lost, its objs are allocable with the free list
    this._blockPtr = alloc(this._blockSize);
    this._nextPtr = this._blockPtr;
    this._numLeft = this._numPerBlock;
  }

  public alloc(): PTR_T {
    let dataPtr: PTR_T;
    if (this._freePtr != NULL_PTR) {
      dataPtr = this._freePtr;
      this._freePtr = load<PTR_T>(this._freePtr);
      myAssert((this._freePtr == NULL_PTR) || ((this._freePtr & this._alignMask) == 0));
    } else {
      if (this._numLeft == 0) {
        this.allocBlock();
      }
      myAssert(this._numLeft > 0 && this._nextPtr !== NULL_PTR);
      dataPtr = (this._nextPtr + this._alignMask) & ~this._alignMask;
      this._nextPtr += this._objSize;
      this._numLeft--;
    }
    myAssert((dataPtr & this._alignMask) == 0);
    return dataPtr;
  }

  @inline public dealloc(ptr: PTR_T): void {
    if (ptr != NULL_PTR) {
      assertPtrLowerBound(ptr);
      myAssert((ptr & this._alignMask) == 0); // add other checks ?
      store<PTR_T>(ptr, this._freePtr);
      this._freePtr = ptr;
    }
  }

}

function newArena(objSize: SIZE_T, numObjPerBlock: u32, objAlignLg2: SIZE_T = alignof<PTR_T>()): ArenaAlloc {
  const arenaSize = getTypeSize<ArenaAlloc>();
  const ptr: PTR_T = alloc(arenaSize);
  const arena = changetype<ArenaAlloc>(ptr);
  arena.init(objSize, numObjPerBlock, objAlignLg2);
  return arena;
}

export { ArenaAlloc, newArena };
