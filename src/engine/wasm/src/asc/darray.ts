import { myAssert } from './myAssert';
import { alloc, dealloc } from './memManager';
import { SIZE_T, PTR_T, getTypeSize } from './memUtils';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { logi } from './importVars';


function calcAllocSize(capacity: u32, objSize: u32, alignMask: u32): u32 {
  return capacity * objSize + alignMask;
}

@final @unmanaged class DArray<T> {
  private _array: PTR_T; // physical array start
  private _data: PTR_T;  // where data start
  private _next: PTR_T;
  private _arrayEnd: PTR_T;
  private _allocSize: SIZE_T;
  private _capacity: u32;
  private _length: u32;
  private _objSize: SIZE_T;
  private _alignMask: usize;

  // private constructor() {
  //   this._array = this._data = 0;
  //   this._allocSize = this._objSize = 0;
  //   this._arrayEnd = 0;
  //   this._length = 0;
  //   this._next = 0;
  //   this._alignMask = 0;
  //   this._capacity = 0;
  // }

  constructor(allocPtr: PTR_T, initialCapacity: u32, alignLg2: usize) {
    const darray = changetype<DArray<T>>(allocPtr);
    darray.init(initialCapacity, alignLg2);
    return darray;
  }

  private init(initialCapacity: u32, alignLg2: usize): void {
    const capacity = max(initialCapacity, 1);
    const objSize = getTypeSize<T>();
    const alignMask = (<usize>(1) << alignLg2) - 1;
    this._objSize = (objSize + alignMask) & ~alignMask; // TODO change
    this._allocSize = calcAllocSize(capacity, this._objSize, this._alignMask);
    this._array = alloc(this._allocSize);
    this._data = (this._array + alignMask) & ~alignMask;
    this._arrayEnd = this._data + capacity * objSize;
    this._length = 0;
    this._next = this._data;
    this._alignMask = alignMask;
    this._capacity = capacity;
    myAssert((this._data & alignMask) === 0);
  }

  @inline get objSize(): SIZE_T {
    return this._objSize;
  }

  @inline get start(): PTR_T {
    return this._data;
  }

  @inline get end(): PTR_T {
    return this._next;
  }

  @inline get length(): u32 {
    return this._length;
  }

  @inline get arrayStart(): PTR_T {
    return this._array;
  }

  @inline get arrayEnd(): PTR_T {
    return this._arrayEnd;
  }

  @inline at(ptr: PTR_T): T {
    myAssert(ptr >= this.start && ptr < this.end);
    if (isReference<T>()) {
      return changetype<T>(ptr);
    } else {
      return load<T>(ptr);
    }
  }

  // @inline @operator("[]") atIdx(idx: u32): T {
  @inline @operator("[]") get(idx: u32): T {
    myAssert(idx < this.length);
    const ptr = this.start + this.objSize * idx;
    return this.at(ptr);
  }

  @inline setValue(ptr: PTR_T, value: T): void {
    myAssert(ptr >= this.start && ptr < this.end);
    if (isReference<T>()) {
      myAssert(value != null);
      memory.copy(ptr, changetype<PTR_T>(value), offsetof<T>());
    } else {
      store<T>(ptr, value);
    }
  }

  @inline @operator("[]=") set(idx: u32, value: T): void {
    myAssert(idx < this.length);
    const ptr = this.start + this.objSize * idx;
    this.setValue(ptr, value);
  }

  @inline push(value: T): void {
    if (this._next >= this.arrayEnd) {
      const newCapacity = 2 * this._capacity;
      const newAllocSize = calcAllocSize(newCapacity, this._objSize, this._alignMask);
      const newArray = alloc(newAllocSize);
      const newData = (newArray + this._alignMask) & ~this._alignMask;
      const newNext = newData + this._next - this.start;
      const newArrayEnd = newData + newCapacity * this._objSize;
      memory.copy(newData, this._data, this.arrayEnd - this.start);
      dealloc(this.arrayStart);
      this._capacity = newCapacity;
      this._array = newArray;
      this._data = newData;
      this._allocSize = newAllocSize;
      this._next = newNext;
      this._arrayEnd = newArrayEnd;
    }
    const _ptr = this._next;
    this._next += this.objSize;
    this.setValue(_ptr, value);
    this._length++;
  }

  // TODO
  // @inline pop(): void {}

}

let arrayArena: ArenaAlloc;

@inline function initDArrayAllocator(): void {
  const ARR_BLOCK_SIZE = 64;
  const objSize = getTypeSize<DArray<Object>>();
  arrayArena = newArena(objSize, ARR_BLOCK_SIZE);
}

@inline function newDArray<T>(initialCapacity: u32, alignLg2: usize = alignof<T>()): DArray<T> {
  const ptr = arrayArena.alloc();
  return new DArray<T>(ptr, initialCapacity, alignLg2);
}

@inline function deleteDArray<T>(arr: DArray<T>): void {
  dealloc(arr.arrayStart);
  arrayArena.dealloc(changetype<PTR_T>(arr));
}

export { DArray, initDArrayAllocator, newDArray, deleteDArray };
