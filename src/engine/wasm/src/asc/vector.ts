import { myAssert } from './myAssert';
import { logi } from './importVars';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { alloc, dealloc } from './workerHeapAlloc';

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

  get objSize(): u32 {
    return this._objSize;
  }

  get start(): usize {
    return this._data;
  }

  get end(): usize {
    return this._array + this._allocSize;
  }

  at(offs: usize): T {
    return changetype<T>(this._data + offs);
  }

  get length(): u32 {
    return this._length;
  }

  atIdx(idx: u32): T {
    const offs = this.objSize * idx;
    return changetype<T>(this._data + offs);
  }

  get physArr(): usize {
    return this._array;
  }
}

function initVectorAllocator(): void {
  const objSize: u32 = offsetof<Vector<Object>>();
  arrayArena = newArena(objSize, ARR_BLOCK_SIZE);
}

function newVector<T>(length: u32, alignLg2: u32): Vector<T> {
  const objSize: u32 = offsetof<T>();
  const myArray = changetype<Vector<T>>(arrayArena.alloc());
  myArray.init(length, objSize, alignLg2);
  return myArray;
}

function deleteVector<T>(array: Vector<T>): void {
  dealloc(array.physArr);
  arrayArena.dealloc(changetype<usize>(array));
}

export { Vector, initVectorAllocator, newVector, deleteVector };
