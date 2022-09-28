import { myAssert } from './myAssert';
import { alloc, dealloc } from './memManager';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { ilog2, nextPowerOfTwo, isSizePowerTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from './memUtils';
import { Pointer } from './pointer';
import { logi } from './importVars';

// SArray: a contigous block of memory: header info + data
// start address | .... HEADER | objects memory (no references)
//                               |<- the SArray starts here
// obj size is rounded to a power of two

@final @unmanaged class Header {
  _arrayPtr: PTR_T; // address returned by alloc (used for dealloc only)
  _objSizeLg2: SIZE_T; // lg2 of the size (includes padding for the alignment)
  _length: SIZE_T; // to do some checks
}

const HEADER_SIZE = getTypeSize<Header>();

@final @unmanaged class SArray<T> {

  // @inline private getHeader(): Header {
  //   const dataPtr = changetype<PTR_T>(this);
  //   return changetype<Header>(dataPtr - HEADER_SIZE);
  // }

  private idx2Ptr(idx: SIZE_T): PTR_T {
    const dataPtr = changetype<PTR_T>(this);
    const header = changetype<Header>(dataPtr - HEADER_SIZE);
    myAssert(idx < header._length);
    const offset = idx << header._objSizeLg2;
    const addr = dataPtr + offset;
    return addr;
  }

  @inline length(): i32 {
    const dataPtr = changetype<PTR_T>(this);
    const header = changetype<Header>(dataPtr - HEADER_SIZE);
    return <i32>( header._length );
  }

  @inline dataPtr(): PTR_T {
    const dataPtr = changetype<PTR_T>(this);
    return dataPtr;
  }

  ptrAt(idx: SIZE_T): PTR_T {
    const ptr = this.idx2Ptr(idx);
    return ptr;
  }

  at(idx: SIZE_T): T {
    const ptr = this.idx2Ptr(idx);
    return new Pointer<T>(ptr).value;
  }

  set(idx: SIZE_T, value: T): void {
    const ptr = this.idx2Ptr(idx);
    new Pointer<T>(ptr).value = value;
  }


  // @inline @operator("[]") get(idx: u32): T {
  //   return this.at(idx);
  // }

  // @inline @operator("[]=") set(idx: u32, value: T): void {
  // }

}

function newSArray<T>(length: SIZE_T, objAlignLg2: SIZE_T = alignof<T>()): SArray<T> {
  // logi(objAlignLg2);
  myAssert(length > 0);
  let objSize = getTypeSize<T>();
  myAssert(objSize > 0);
  if (!isSizePowerTwo(objSize)) {
    objSize = nextPowerOfTwo(objSize);
  }
  const alignMask: SIZE_T = max(<SIZE_T>(1) << objAlignLg2, objSize) - 1;
  const objSizeAlign = alignMask + 1;
  myAssert(isSizePowerTwo(objSizeAlign));
  const dataSize: SIZE_T = length * objSizeAlign + alignMask;
  const arraySize = HEADER_SIZE + dataSize;
  const arrayPtr = alloc(arraySize);
  const dataPtr = (arrayPtr + HEADER_SIZE + alignMask) & ~alignMask;
  const header = changetype<Header>(dataPtr - HEADER_SIZE); // potentially disaligned but ok
  header._arrayPtr = arrayPtr;
  header._objSizeLg2 = ilog2(objSizeAlign);
  header._length = length;
  return changetype<SArray<T>>(dataPtr);
}

function deleteSArray<T>(arr: SArray<T>): void {
  const dataPtr = changetype<PTR_T>(arr);
  const header = changetype<Header>(dataPtr - HEADER_SIZE);
  dealloc(header._arrayPtr);
}

export { SArray, newSArray, deleteSArray };
