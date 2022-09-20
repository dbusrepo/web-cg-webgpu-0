import { initObjectAllocatorsArena } from './objectAllocator';
import { initVec3Allocator } from './vec3';
import { initBitImageAllocator } from  './bitImage';
import { initDArrayAllocator } from './darray';

function initModules(): void {
  // init memory here ?
  initObjectAllocatorsArena();
  initDArrayAllocator();
  initVec3Allocator();
  initBitImageAllocator();
}

export { initModules };
