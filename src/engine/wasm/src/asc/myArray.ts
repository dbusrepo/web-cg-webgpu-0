import { myAssert } from './myAssert';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { logi } from './importVars';

class Fake {}

let arena: ArenaAlloc<MyArray<Fake>>;

class MyArray<T> {
  data: usize;

}

export { MyArray };
