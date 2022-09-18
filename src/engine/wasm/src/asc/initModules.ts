import { initObjectAllocatorsArena } from './objectAllocator';
import { initVec3Allocator } from './vec3';
import { initBitImageAllocator } from  './bitImage';

function initModules(): void {
  initObjectAllocatorsArena();
  initVec3Allocator();
  initBitImageAllocator();
}

export { initModules };
