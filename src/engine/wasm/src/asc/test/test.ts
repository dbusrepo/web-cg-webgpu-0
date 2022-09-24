import { memManagerTest } from './memManager';
import { arenaAllocTest } from './arenaAlloc';

function test(): void {
  // memManagerTest();
  arenaAllocTest();
}

export { test };
