import { myAssert } from './myAssert';
import { alloc, dealloc } from './memManager';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { logi } from './importVars';

const OBJ_ALLOC_BLOCK_SIZE = 64;
let objectAllocatorsArena: ArenaAlloc;

class ObjectAllocator<T> {
  private arena: ArenaAlloc;
  private constructor() {}
  private getObjectSize(): u32 {
    return offsetof<T>();
  }
  init(arenaBlockSize: u32): void {
    this.arena = newArena(this.getObjectSize(), arenaBlockSize);
  }
  new(): T {
    return changetype<T>(this.arena.alloc());
  }
  delete(v: T): void {
    this.arena.dealloc(changetype<usize>(v));
  }
  newArray(length: u32): usize {
    const allocSize = length * this.getObjectSize();
    return alloc(allocSize);
  }
  deleteArray(arr: usize): void {
    dealloc(arr);
  }
}

function newObjectAllocator<T>(blockSize: u32): ObjectAllocator<T> {
  const objAlloc = changetype<ObjectAllocator<T>>(objectAllocatorsArena.alloc());
  objAlloc.init(blockSize);
  return objAlloc;
}

function initObjectAllocatorsArena(): void {
  const objSize: u32 = offsetof<ObjectAllocator<Object>>();
  objectAllocatorsArena = newArena(objSize, OBJ_ALLOC_BLOCK_SIZE);
}

export { ObjectAllocator, initObjectAllocatorsArena, newObjectAllocator };
