import { myAssert } from './myAssert';
import { alloc, dealloc } from './workerHeapManager';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { ilog2, nextPowerOfTwo, isSizePowerTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from './memUtils';
import { Pointer } from './pointer';
import { logi } from './importVars';

// SArray: a contigous block of memory: header info + data
// start address | .... HEADER | objects memory (no references)
//                               |<- the SArray starts here
// obj size is rounded to a power of two

@final @unmanaged class Header {
  _arrayPtr: PTR_T = NULL_PTR; // address returned by alloc (used for dealloc only)
  _objSizeLg2: SIZE_T = 0; // lg2 of the array elements size (includes padding for the alignment)
  _length: SIZE_T = 0; // to do some checks
}

const HEADER_SIZE = getTypeSize<Header>();

@inline function getHeader<T>(arr: SArray<T>): Header {
  const dataPtr = changetype<PTR_T>(arr);
  const header = changetype<Header>(dataPtr - HEADER_SIZE);
  return header;
};

@final @unmanaged class SArray<T> {

  // @inline private getHeader(): Header {
  //   const dataPtr = changetype<PTR_T>(this);
  //   return changetype<Header>(dataPtr - HEADER_SIZE);
  // }

  private idx2Ptr(idx: SIZE_T): PTR_T {
    const header = getHeader(this);
    myAssert(idx < header._length);
    const offset = idx << header._objSizeLg2;
    const ptr = changetype<PTR_T>(this) + offset;
    return ptr;
  }

  @inline length(): SIZE_T {
    return getHeader(this)._length;
  }

  @inline dataPtr(): PTR_T {
    return changetype<PTR_T>(this);
  }

  ptrAt(idx: SIZE_T): PTR_T {
    return this.idx2Ptr(idx);
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
  const objSizeAlign = max(<SIZE_T>(1) << objAlignLg2, objSize);
  const alignMask =  objSizeAlign - 1;
  // myAssert(isSizePowerTwo(objSizeAlign));
  const dataSize: SIZE_T = length * objSizeAlign + alignMask;
  const arraySize = HEADER_SIZE + dataSize;
  const arrayPtr = alloc(arraySize);
  const dataPtr = (arrayPtr + HEADER_SIZE + alignMask) & ~alignMask;
  const sarray = changetype<SArray<T>>(dataPtr);
  const header = getHeader(sarray);
  header._arrayPtr = arrayPtr;
  header._objSizeLg2 = ilog2(objSizeAlign);
  header._length = length;
  return sarray;
}

function deleteSArray<T>(arr: SArray<T>): void {
  const header = getHeader(arr);
  dealloc(header._arrayPtr);
}

export { SArray, newSArray, deleteSArray };
