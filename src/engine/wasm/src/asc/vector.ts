import { myAssert } from './myAssert';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { alloc, dealloc } from './workerHeapAlloc';
import { logi } from './importVars';

const ARR_BLOCK_SIZE: u32 = 128;
let arrayArena: ArenaAlloc;

class Vector<T> {
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
    return changetype<T>(this._data + offs);
  }

  @inline @operator("[]") get(idx: i32): T {
    // @inline @operator("[]") atIdx(idx: u32): T {
    logi(-3);
    const offs = this.objSize * idx;
    return changetype<T>(this._data + offs);
  }

}

function initVectorAllocator(): void {
  const objSize: u32 = offsetof<Vector<Object>>();
  arrayArena = newArena(objSize, ARR_BLOCK_SIZE);
}

function newVector<T>(length: u32, alignLg2: u32 = alignof<T>()): Vector<T> {
  const objSize: u32 = isReference<T>() ? offsetof<T>() : sizeof<T>();
  const myArray = changetype<Vector<T>>(arrayArena.alloc());
  myArray.init(length, objSize, alignLg2);
  return myArray;
}

function deleteVector<T>(vec: Vector<T>): void {
  dealloc(vec.array);
  arrayArena.dealloc(changetype<usize>(vec));
}

export { Vector, initVectorAllocator, newVector, deleteVector };
