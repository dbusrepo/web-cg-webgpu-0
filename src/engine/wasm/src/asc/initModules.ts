import { initObjectAllocatorsArena } from './objectAllocator';
import { initVec3Allocator } from './vec3';
import { initBitImageAllocator } from  './bitImage';
import { initMyArrayAllocator } from './myArray';

function initModules(): void {
  initObjectAllocatorsArena();
  initMyArrayAllocator();
  initVec3Allocator();
  initBitImageAllocator();
}

export { initModules };
