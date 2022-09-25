import { initObjectAllocatorsArena } from './objectAllocator';
import { initVec3Allocator } from './vec3';
import { initBitImageAllocator } from  './bitImage';
import { initDArrayAllocator } from './darray';
import { initRefAllocator } from './ref';

function initAllocators(): void {
  initObjectAllocatorsArena();
  initRefAllocator();
  // initDArrayAllocator();
  initVec3Allocator();
  // initBitImageAllocator(); // va in ecc
}

export { initAllocators };
