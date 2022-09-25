import { memManagerTest } from './memManager';
import { arenaAllocTest } from './arenaAlloc';
import { sarrayTest } from './sarray';
import { refTest } from './ref';

function test(): void {
  // memManagerTest();
  // arenaAllocTest();
  // sarrayTest();
  refTest();
}

export { test };
