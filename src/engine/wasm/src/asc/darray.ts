import { myAssert } from './myAssert';
import { alloc, dealloc } from './memManager';
import { ilog2, nextPowerOfTwo, isSizePowerTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from './memUtils';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { Pointer } from './pointer';
import { logi } from './importVars';

@final @unmanaged class DArray<T> {
  private _array: PTR_T; // physical array start
  private _dataStart: PTR_T;  // where data start
  private _dataEnd: PTR_T;
  private _next: PTR_T;
  private _capacity: u32;
  private _objSizeLg2: SIZE_T;
  private _alignMask: usize;
  // private _allocSize: SIZE_T; // not used

  init(initialCapacity: u32, objAlignLg2: SIZE_T = alignof<T>()): void {
    myAssert(initialCapacity > 0);
    const capacity = initialCapacity;
    let objSize = getTypeSize<T>();
    myAssert(objSize > 0);
    if (!isSizePowerTwo(objSize)) {
      objSize = nextPowerOfTwo(objSize);
    }
    const alignMask: SIZE_T = max(<SIZE_T>(1) << objAlignLg2, objSize) - 1;
    const objSizeAlign = alignMask + 1;
    myAssert(isSizePowerTwo(objSizeAlign));
    const numBytesData = capacity * objSizeAlign;
    const allocSize = numBytesData + this._alignMask;
    this._array = alloc(allocSize);
    this._dataStart = (this._array + alignMask) & ~alignMask;
    this._dataEnd = this._dataStart + numBytesData;
    this._next = this._dataStart;
    this._objSizeLg2 = ilog2(objSizeAlign);
    this._alignMask = alignMask;
    this._capacity = capacity;
    myAssert((this._dataStart & alignMask) === 0);
    myAssert(this.count == 0);
  }

  @inline get count(): SIZE_T {
    return (this._next - this._dataStart) >> this._objSizeLg2;
  }

  @inline get arrayStart(): PTR_T {
    return this._array;
  }

  @inline private idx2Ptr(idx: u32): PTR_T {
    myAssert(idx < this.count);
    const offset = idx << this._objSizeLg2;
    return this._dataStart + offset;
  }

  @inline at(idx: u32): T {
    const ptr = this.idx2Ptr(idx);
    return new Pointer<T>(ptr).value;
  }

  @inline setValue(idx: u32, value: T): void {
    const ptr = this.idx2Ptr(idx);
    new Pointer<T>(ptr).value = value;
  }

  private checkMem(): void {
    if (this._next >= this._dataEnd) {
      myAssert(this._next == this._dataEnd);
      const newCapacity = 2 * this._capacity;
      const newNumBytesData = newCapacity * (1 << this._objSizeLg2); 
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

  @inline push(value: T): void {
    const ptr = this.alloc();
    new Pointer<T>(ptr).value = value;
  }

  // like push but add a new uninitialized element and returns a pointer to it
  @inline alloc(): PTR_T {
    this.checkMem();
    const ptr = this._next;
    this._next += (1 << this._objSizeLg2);
    return ptr;
  }

  // TODO
  @inline pop(): void {
    myAssert(this.count > 0);
    this._next -= (1 << this._objSizeLg2);
  }

}

let arrayArena: ArenaAlloc;

@inline function initDArrayAllocator(): void {
  const ARR_BLOCK_SIZE = 128;
  const objSize = getTypeSize<DArray<Object>>();
  arrayArena = newArena(objSize, ARR_BLOCK_SIZE);
}

@inline function newDArray<T>(initialCapacity: u32, alignLg2: usize = alignof<T>()): DArray<T> {
  const darray = changetype<DArray<T>>(arrayArena.alloc());
  darray.init(initialCapacity, alignLg2);
  return darray;
}

@inline function deleteDArray<T>(arr: DArray<T>): void {
  dealloc(arr.arrayStart);
  arrayArena.dealloc(changetype<PTR_T>(arr));
}

export { DArray, initDArrayAllocator, newDArray, deleteDArray };
