import { memManagerTest } from './memManager';
import { arenaAllocTest } from './arenaAlloc';
import { sarrayTest } from './sarray';

function test(): void {
  // memManagerTest();
  // arenaAllocTest();
  sarrayTest();
}

export { test };
