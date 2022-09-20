import { myAssert } from './myAssert';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { alloc, dealloc } from './workerHeapAlloc';
import { logi } from './importVars';

// SArray: 
// start | padding | offset to start from data | objSize | endPtr | data

type TOFFSET = u32;
type TALIGNMASK = u32;
const ALIGN_MASK_SIZE: u32 = sizeof<TOFFSET>();
const OFFSET_SIZE: u32 = sizeof<TOFFSET>();

@final @unmanaged class SArray<T> {

  @inline get objSize(): u32 {
    return this._objSize;
  }

  @inline get deallocAddr(): usize {
    const dataPtr = changetype<usize>(this);
    const offsetPtr = dataPtr - OFFSET_SIZE;
    const offset = load<TOFFSET>(offsetPtr);
    return dataPtr - offset;
  }
}

function newSArray<T>(length: u32, alignLg2: u32 = alignof<T>()): SArray<T> {
  myAssert(length > 0);
  const objSize: u32 = isReference<T>() ? offsetof<T>() : sizeof<T>();
  const alignMask = (1 << alignLg2) - 1;
  const allocSize: u32 = OFFSET_SIZE + length * objSize + alignMask;
  const blockPtr = alloc(allocSize);
  const dataPtr = (blockPtr + OFFSET_SIZE + alignMask) & ~alignMask;
  myAssert(dataPtr >= blockPtr + OFFSET_SIZE);
  const offsetPtr = dataPtr - OFFSET_SIZE;
  const offset = dataPtr - blockPtr; // possibly unaligned but ok...
  store<TOFFSET>(offsetPtr, offset); // store distance to start, used with dealloc
  return changetype<SArray<T>>(dataPtr);
}

function deleteSArray<T>(arr: SArray<T>): void {
  dealloc(arr.deallocAddr);
}

export { SArray, newSArray, deleteSArray };
