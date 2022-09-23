import { initObjectAllocatorsArena } from './objectAllocator';
import { initVec3Allocator } from './vec3';
import { initBitImageAllocator } from  './bitImage';
import { initDArrayAllocator } from './darray';

function initAllocators(): void {
  initObjectAllocatorsArena();
  initDArrayAllocator();
  initVec3Allocator();
  // initBitImageAllocator(); // va in ecc
}

export { initAllocators };
