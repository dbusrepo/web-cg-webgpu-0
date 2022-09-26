import { myAssert } from './myAssert';
import { alloc, dealloc } from './memManager';
import { PTR_SIZE, PTR_ALIGN_MASK, SIZE_T, MAX_ALLOC_SIZE, 
         PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask } from './memUtils';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { logi } from './importVars';

@final @unmanaged class ObjectAllocator<T> {
  private _arena: ArenaAlloc;

  init(numObjPerBlock: SIZE_T): void {
    this._arena = newArena(getTypeSize<T>(), numObjPerBlock);
  }

  new(): T {
    return changetype<T>(this._arena.alloc());
  }

  delete(v: T): void {
    this._arena.dealloc(changetype<PTR_T>(v));
  }
}

let objectAllocatorsArena: ArenaAlloc;

function initObjectAllocatorsArena(): void {
  const NUM_OBJ_ALLOC_PER_BLOCK = 64;
  const objSize: SIZE_T = offsetof<ObjectAllocator<Object>>();
  objectAllocatorsArena = newArena(objSize, NUM_OBJ_ALLOC_PER_BLOCK);
}

function newObjectAllocator<T>(numObjPerBlock: SIZE_T): ObjectAllocator<T> {
  const objAlloc = changetype<ObjectAllocator<T>>(objectAllocatorsArena.alloc());
  objAlloc.init(numObjPerBlock);
  return objAlloc;
}

export { ObjectAllocator, initObjectAllocatorsArena, newObjectAllocator };
