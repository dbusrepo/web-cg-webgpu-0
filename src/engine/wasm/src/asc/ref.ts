import { myAssert } from './myAssert';
import { Pointer } from './pointer';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { GET_PTR, ilog2, nextPowerOfTwo, isSizePowerTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from './memUtils';
import { logi } from './importVars';

@final @unmanaged class Ref<T> {
  private _ptr: Pointer<T>;

  init(ptr: PTR_T = NULL_PTR): void {
    this.ptr = ptr;
  }

  @inline get ptr(): PTR_T {
    return this._ptr.offset;
  }

  @inline set ptr(ptr: PTR_T) {
    this._ptr = new Pointer<T>(ptr);
  }

  @inline get deref(): T {
    myAssert(!this.isNull);
    return this._ptr.value;
  }

  @inline set deref(v: T) {
    myAssert(!this.isNull);
    this._ptr.value = v;
  }

  @inline get isNull(): boolean {
    return this.ptr == NULL_PTR;
  }
}


let refArena!: ArenaAlloc;

function initRefAllocator(): void {
  const NUM_REFS_PER_BLOCK: u32 = 128;
  const objSize = getTypeSize<Ref<Object>>();
  refArena = newArena(objSize, NUM_REFS_PER_BLOCK);
}

// to alloc single Refs use the alloc function here
function newRef<T>(ptr: PTR_T = NULL_PTR): Ref<T> {
  const ref = changetype<Ref<T>>(refArena.alloc());
  ref.init(ptr);
  return ref;
}

export { Ref, initRefAllocator, newRef };
