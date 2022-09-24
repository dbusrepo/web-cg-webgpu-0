import { myAssert } from './myAssert';

export type PTR_T = usize; // raw pointer type
export type SIZE_T = u32;
export const NULL_PTR: PTR_T = 0; // TODO note
export const PTR_SIZE: SIZE_T = getTypeSize<PTR_T>();
export const PTR_ALIGN_MASK: SIZE_T = getTypeAlignMask<PTR_T>();

// Max alloc size for blocks allocated by the mem manager
export const MAX_ALLOC_SIZE: SIZE_T = <SIZE_T>(1) << 30; // 1GB

const CHAR_BIT = 8;

// for mem manager blocks, use the bit 31 or 63 as the 'usage' bit in block size field
@inline function getUsageBitMask(): SIZE_T {
  const bitPos = getTypeSize<SIZE_T>() * CHAR_BIT - 1;
  const usageBitMask = <SIZE_T>(1) << bitPos;
  myAssert(MAX_ALLOC_SIZE < usageBitMask);
  return usageBitMask;
}

@inline function isSizePowerTwo(n: SIZE_T): boolean {
  return n != 0 && ((n & (n - 1)) == 0);
}

@inline function ilog2(n: SIZE_T): SIZE_T {
  return getValueTypeSize(n) * CHAR_BIT - clz(n) - 1;
}

// next power of two, ex: 3 -> 4, 4 -> 8
@inline function nextPowerOfTwo(n: SIZE_T): SIZE_T {
  const numBits = getValueTypeSize(n) * CHAR_BIT;
  myAssert(n < (1 << (numBits - 1)));
  return 1 << (numBits - clz(n));
}

export const MEM_BLOCK_USAGE_BIT_MASK = getUsageBitMask();

@inline function getTypeSize<T>(): SIZE_T {
  return <SIZE_T>(isReference<T>() ? offsetof<T>() : sizeof<T>());
}

@inline function getValueTypeSize<T>(x: T): SIZE_T {
  return getTypeSize<T>();
}

@inline function getTypeAlignMask<T>(): SIZE_T {
  return <SIZE_T>((1 << alignof<PTR_T>()) - 1);
}

export { ilog2, nextPowerOfTwo, isSizePowerTwo, getTypeSize, getValueTypeSize, getTypeAlignMask };
