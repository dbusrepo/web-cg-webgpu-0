import { myAssert } from './myAssert';

export type PTR_T = usize; // raw pointer type
export type SIZE_T = usize;
export const NULL_PTR: PTR_T = 0; // TODO note
export const PTR_SIZE: SIZE_T = getTypeSize<PTR_T>();
export const PTR_ALIGN_MASK: SIZE_T = getTypeAlignMask<PTR_T>();

// Max alloc size for blocks allocated by the mem manager
export const MAX_ALLOC_SIZE: SIZE_T = <SIZE_T>(1) << 30; // 1GB

// for mem manager blocks, use the bit 31 or 63 as the 'usage' bit in block size field
@inline function getUsageBitMask(): SIZE_T {
  const bitPos = getTypeSize<SIZE_T>() * 8 - 1;
  const usageBitMask = <SIZE_T>(1) << bitPos;
  myAssert(MAX_ALLOC_SIZE < usageBitMask);
  return usageBitMask;
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

export { getTypeSize, getValueTypeSize, getTypeAlignMask };
