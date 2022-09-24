import { myAssert } from './myAssert';
import { alloc, dealloc } from './memManager';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { ilog2, nextPowerOfTwo, isSizePowerTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from './memUtils';
import { logi } from './importVars';

// SArray: a contigous block of memory: header info + data
// start address | .... HEADER | objects memory (no references)
//                               |<- the SArray starts here
// obj size is rounded to a power of two

@final @unmanaged class Header {
  arrayPtr: PTR_T; // address returned by alloc (used for dealloc only)
  _objSizeLg2: SIZE_T; // lg2 of the size (includes padding for the alignment)
  length: u32; // to do some checks
}

const HEADER_SIZE = getTypeSize<Header>();

@final @unmanaged class SArray<T> {

  @inline private idx2Ptr(idx: u32): PTR_T {
    const dataPtr = changetype<PTR_T>(this);
    const header = changetype<Header>(dataPtr - HEADER_SIZE);
    myAssert(idx < header.length);
    const offset = idx << header._objSizeLg2;
    const addr = dataPtr + offset;
    return addr;
  }

  @inline @operator("[]") get(idx: u32): T {
    const ptr = this.idx2Ptr(idx);
    return changetype<T>(ptr);
  }

  @inline @operator("[]=") set(idx: u32, value: T): void {
    const ptr = this.idx2Ptr(idx);
    if (isReference<T>()) {
      if (isNullable<T>()) {
        myAssert(value != null);
      }
      memory.copy(ptr, changetype<PTR_T>(value), offsetof<T>());
    } else {
      store<T>(ptr, value);
    }
  }

}

function newSArray<T>(length: u32, objAlignLg2: SIZE_T = alignof<T>()): SArray<T> {
  myAssert(length > 0);
  let objSize = getTypeSize<T>();
  if (!isSizePowerTwo(objSize)) {
    objSize = nextPowerOfTwo(objSize);
  }
  const alignMask: SIZE_T = max(<SIZE_T>(1) << objAlignLg2, objSize) - 1;
  const objSizeAlign: SIZE_T = max(alignMask + 1, objSize);
  myAssert(isSizePowerTwo(objSizeAlign));
  const dataSize: SIZE_T = length * objSizeAlign + alignMask;
  const arraySize = HEADER_SIZE + dataSize;
  const arrayPtr = alloc(arraySize);
  const dataPtr = (arrayPtr + HEADER_SIZE + alignMask) & ~alignMask;
  const header = changetype<Header>(dataPtr - HEADER_SIZE); // potentially disaligned but ok
  header.arrayPtr = arrayPtr;
  header._objSizeLg2 = ilog2(objSizeAlign);
  header.length = length;
  return changetype<SArray<T>>(dataPtr);
}

function deleteSArray<T>(arr: SArray<T>): void {
  const dataPtr = changetype<PTR_T>(arr);
  const header = changetype<Header>(dataPtr - HEADER_SIZE);
  dealloc(header.arrayPtr);
}

export { SArray, newSArray, deleteSArray };
