import { myAssert } from './myAssert';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { alloc, dealloc } from './workerHeapAlloc';
import { logi } from './importVars';

const ARR_BLOCK_SIZE: u32 = 128;
let arrayArena: ArenaAlloc;

@unmanaged class SArray<T> {
  private _array: usize;
  private _allocSize: u32;
  private _data: usize;
  private _objSize: u32;
  private _length: u32;

  private constructor() {
    this._array = this._data = 0;
    this._allocSize = this._objSize = this._length = 0;
  }

  init(length: u32, objSize: u32, alignLg2: u32): void {
    this._length = length;
    const alignMask = (1 << alignLg2) - 1;
    this._objSize = (objSize + alignMask) & ~alignMask;
    this._allocSize = this._length * this._objSize + alignMask;
    this._array = alloc(this._allocSize);
    this._data = (this._array + alignMask) & ~alignMask;
    myAssert((this._data & alignMask) === 0);
  }

  @inline get objSize(): u32 {
    return this._objSize;
  }

  @inline get start(): usize {
    return this._data;
  }

  @inline get end(): usize {
    return this._array + this._allocSize;
  }

  @inline get length(): u32 {
    return this._length;
  }

  @inline get array(): usize {
    return this._array;
  }

  @inline at(offs: usize): T {
    const ptr = this._data + offs;
    if (isReference<T>()) {
      return changetype<T>(ptr);
    } else {
      return load<T>(ptr);
    }
  }

  // @inline @operator("[]") atIdx(idx: u32): T {
  @inline @operator("[]") get(idx: i32): T {
    const offs = usize(this.objSize) * idx;
    return this.at(offs);
  }

  @inline setValue(offs: usize, value: T): void {
    const ptr = this._data + offs;
    if (isReference<T>()) {
      myAssert(value != null);
      memory.copy(ptr, changetype<usize>(value), offsetof<T>());
    } else {
      store<T>(ptr, value);
    }
  }

  @inline @operator("[]=") set(idx: i32, value: T): void {
    const offs = usize(this.objSize) * idx;
    this.setValue(offs, value);
  }

}

function initSArrayAllocator(): void {
  const objSize: u32 = offsetof<SArray<Object>>();
  arrayArena = newArena(objSize, ARR_BLOCK_SIZE);
}

function newSArray<T>(length: u32, alignLg2: u32 = alignof<T>()): SArray<T> {
  const objSize: u32 = isReference<T>() ? offsetof<T>() : sizeof<T>();
  const myArray = changetype<SArray<T>>(arrayArena.alloc());
  myArray.init(length, objSize, alignLg2);
  return myArray;
}

function deleteSArray<T>(vec: SArray<T>): void {
  dealloc(vec.array);
  arrayArena.dealloc(changetype<usize>(vec));
}

export { SArray, initSArrayAllocator, newSArray, deleteSArray };
