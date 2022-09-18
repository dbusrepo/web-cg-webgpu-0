import { myAssert } from './myAssert';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { logi } from './importVars';

const OBJ_ALLOC_BLOCK_SIZE = 64;
let objectAllocatorsArena: ArenaAlloc;

class ObjectAllocator<T> {
  arena: ArenaAlloc;
  private constructor() {}
  init(blockSize: u32): void {
    const objSize = offsetof<T>();
    this.arena = newArena(objSize, blockSize);
  }
  new(): T {
    return changetype<T>(this.arena.alloc());
  }
  delete(v: T): void {
    this.arena.dealloc(changetype<usize>(v));
  }
}

function newObjectAllocator<T>(blockSize: u32): ObjectAllocator<T> {
  const objAlloc = changetype<ObjectAllocator<T>>(objectAllocatorsArena.alloc());
  objAlloc.init(blockSize);
  return objAlloc;
}

function initObjectAllocatorsArena(): void {
  const objSize = offsetof<ObjectAllocator<Object>>();
  objectAllocatorsArena = newArena(objSize, OBJ_ALLOC_BLOCK_SIZE);
}

export { ObjectAllocator, initObjectAllocatorsArena, newObjectAllocator };
