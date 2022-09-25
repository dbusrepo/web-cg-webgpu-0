import { memManagerTest } from './memManager';
import { arenaAllocTest } from './arenaAlloc';
import { sarrayTest } from './sarray';
import { darrayTest } from './darray';
import { refTest } from './ref';

function test(): void {
  // memManagerTest();
  // arenaAllocTest();
  sarrayTest();
  // refTest();
  // darrayTest();
}

export { test };
