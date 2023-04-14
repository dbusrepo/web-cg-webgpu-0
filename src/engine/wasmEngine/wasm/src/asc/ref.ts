import { myAssert } from './myAssert';
import { Pointer } from './pointer';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { PTR_T, NULL_PTR, getTypeSize } from './memUtils';
import { logi } from './importVars';

// @ts-ignore: decorator
@final @unmanaged class Ref<T> {
  private _ptr: Pointer<T>;

  init(ptr: PTR_T = NULL_PTR): void {
    this.ptr = ptr;
  }

  @inline get ptr(): PTR_T {
    return this._ptr.offset;
  }

  set ptr(ptr: PTR_T) {
    this._ptr = new Pointer<T>(ptr);
  }

  @inline get deref(): T {
    myAssert(!this.isNull);
    return this._ptr.value;
  }

  set deref(v: T) {
    myAssert(!this.isNull);
    this._ptr.value = v;
  }

  @inline get isNull(): boolean {
    return this.ptr == NULL_PTR;
  }
}

let refArena = changetype<ArenaAlloc>(NULL_PTR);

function initRefArena(): void {
  const NUM_REFS_PER_BLOCK: u32 = 128;
  const objSize = getTypeSize<Ref<Object>>();
  refArena = newArena(objSize, NUM_REFS_PER_BLOCK);
}

function newRef<T>(ptr: PTR_T = NULL_PTR): Ref<T> {
  if (changetype<PTR_T>(refArena) == NULL_PTR) {
    initRefArena();
  }
  const ref = changetype<Ref<T>>(refArena.alloc());
  ref.init(ptr);
  return ref;
}

export { Ref, initRefArena as initRefAllocator, newRef };
