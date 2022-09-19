import { initObjectAllocatorsArena } from './objectAllocator';
import { initVec3Allocator } from './vec3';
import { initBitImageAllocator } from  './bitImage';
import { initSArrayAllocator } from './SArray';

function initModules(): void {
  initObjectAllocatorsArena();
  initSArrayAllocator();
  initVec3Allocator();
  initBitImageAllocator();
}

export { initModules };
