import { initObjectAllocatorsArena } from './objectAllocator';
import { initVec3Allocator } from './vec3';
import { initBitImageAllocator } from  './bitImage';
import { initVectorAllocator } from './vector';

function initModules(): void {
  initObjectAllocatorsArena();
  initVectorAllocator();
  initVec3Allocator();
  initBitImageAllocator();
}

export { initModules };
