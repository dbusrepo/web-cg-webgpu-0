import { initObjectAllocatorsArena } from './objectAllocator';
import { initBitImageAllocator } from  './bitImage';
import { initDArrayAllocator } from './darray';
import { initRefAllocator } from './ref';

function initAllocators(): void {
  initObjectAllocatorsArena();
  initRefAllocator();
  initDArrayAllocator();
  initBitImageAllocator();
}

export { initAllocators };
