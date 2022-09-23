import { myAssert } from '../myAssert';
import { alloc, dealloc } from '../memManager';
import { logi } from '../importVars';

function memManagerTest(): void {
  logi(-3);
  let ptr = alloc(30);
  logi(<u32>ptr);
  // dealloc(ptr);
  ptr = alloc(50);
  logi(<u32>ptr);
  logi(-3);
}

export { memManagerTest };
