import { myAssert } from './myAssert';
import { alloc, dealloc } from './workerHeapManager';
import { ilog2, nextPowerOfTwo, isPowerOfTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from './memUtils';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { Pointer } from './pointer';
import { logi } from './importVars';

// @ts-ignore: decorator
@final @unmanaged class DArray<T> {
  private _array: PTR_T = 0; // physical array start
  private _dataStart: PTR_T = 0;  // where data start
  private _dataEnd: PTR_T = 0;
  private _next: PTR_T = 0;
  private _capacity: SIZE_T = 0;
  private _objSizeLg2: SIZE_T = 0;
  private _alignMask: SIZE_T = 0;
  // private _allocSize: SIZE_T; // not used

  init(initialCapacity: SIZE_T, objAlignLg2: SIZE_T = alignof<T>()): void {
    myAssert(initialCapacity > 0);
    const capacity = initialCapacity;
    let objSize = getTypeSize<T>();
    myAssert(objSize > 0);
    objSize = nextPowerOfTwo(objSize);
    const objSizeAlign = max(<SIZE_T>(1) << objAlignLg2, objSize);
    const alignMask =  objSizeAlign - 1;
    // myAssert(isPowerOfTwo(objSizeAlign));
    const numBytesData = capacity * objSizeAlign;
    const allocSize = numBytesData + alignMask;
    this._array = alloc(allocSize);
    this._dataStart = (this._array + alignMask) & ~alignMask;
    this._dataEnd = this._dataStart + numBytesData;
    this._next = this._dataStart;
    this._objSizeLg2 = ilog2(objSizeAlign);
    this._alignMask = alignMask;
    this._capacity = capacity;
    myAssert((this._dataStart & alignMask) === 0);
    myAssert(this.length == 0);
  }

  @inline get length(): i32 {
    return <i32>((this._next - this._dataStart) >> this._objSizeLg2);
  }

  @inline get capacity(): SIZE_T {
    return <SIZE_T>(this._dataEnd - this._dataStart) >> this._objSizeLg2;
  }

  @inline get arrayStart(): PTR_T {
    return this._array;
  }

  private idx2Ptr(idx: SIZE_T): PTR_T {
    myAssert(idx < this.length);
    const offset = idx << this._objSizeLg2;
    return this._dataStart + offset;
  }

  at(idx: SIZE_T): T {
    const ptr = this.idx2Ptr(idx);
    return new Pointer<T>(ptr).value;
  }

  setValue(idx: SIZE_T, value: T): void {
    const ptr = this.idx2Ptr(idx);
    new Pointer<T>(ptr).value = value;
  }

  private checkMem(): void {
    if (this._next >= this._dataEnd) {
      myAssert(this._next == this._dataEnd);
      const newCapacity = 2 * this._capacity;
      const newNumBytesData = newCapacity << this._objSizeLg2; 
      const newAllocSize = newNumBytesData + this._alignMask;
      const newArray = alloc(newAllocSize);
      const newDataStart = (newArray + this._alignMask) & ~this._alignMask;
      const newArrayEnd = newDataStart + newNumBytesData;
      const numSrcBytes = this._next - this._dataStart;
      const newNext = newDataStart + numSrcBytes;
      memory.copy(newDataStart, this._dataStart, numSrcBytes);
      dealloc(this.arrayStart);
      this._array = newArray;
      this._dataStart = newDataStart;
      this._dataEnd = newArrayEnd;
      this._next = newNext;
      this._capacity = newCapacity;
    }
  }

  private get objSize(): SIZE_T {
    return 1 << this._objSizeLg2;
  }

  // add a new uninitialized element at the end and returns a pointer to it
  private alloc(): PTR_T {
    this.checkMem();
    const ptr = this._next;
    this._next += this.objSize;
    return ptr;
  }

  push(value: T): void {
    const ptr = this.alloc();
    new Pointer<T>(ptr).value = value;
  }

  pop(): void {
    myAssert(this.length > 0);
    this._next -= this.objSize;
  }
}

let arrayArena = changetype<ArenaAlloc>(NULL_PTR);

function initDArrayAllocator(): void {
  const ARR_BLOCK_SIZE = 128;
  const objSize = getTypeSize<DArray<Object>>();
  arrayArena = newArena(objSize, ARR_BLOCK_SIZE);
}

function newDArray<T>(initialCapacity: SIZE_T, alignLg2: SIZE_T = alignof<T>()): DArray<T> {
  if (changetype<PTR_T>(arrayArena) === NULL_PTR) {
    initDArrayAllocator();
  }
  const arr = changetype<DArray<T>>(arrayArena.alloc());
  arr.init(initialCapacity, alignLg2);
  return arr;
}

function deleteDArray<T>(arr: DArray<T>): void {
  dealloc(arr.arrayStart);
  arrayArena.dealloc(changetype<PTR_T>(arr));
}

export { DArray, newDArray, deleteDArray };
