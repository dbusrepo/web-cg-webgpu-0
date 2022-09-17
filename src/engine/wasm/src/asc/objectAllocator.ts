import { myAssert } from './myAssert';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { logi } from './importVars';

type BaseType = ObjectAllocator<Object>;
let arena: ArenaAlloc<BaseType>;

const OBJ_ALLOC_BLOCK_SIZE = 64;

class ObjectAllocator<T> {
  arena: ArenaAlloc<T>;
  constructor(blockSize: number) {
    this.arena = newArena<T>(blockSize);
  }
  new(): T {
    const p = this.arena.alloc();
    return p;
  }
  delete(v: T): void {
    this.arena.dealloc(v);
  }
}

function newObjectAllocator<T>(): ObjectAllocator<T> {
  const p = arena.alloc();
  return p as ObjectAllocator<T>;
}

function initObjectAllocator(): void {
  arena = newArena<BaseType>(OBJ_ALLOC_BLOCK_SIZE);
}

initObjectAllocator();

export { ObjectAllocator };

