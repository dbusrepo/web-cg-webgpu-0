import { myAssert } from '../myAssert';
import { SArray, newSArray, deleteSArray } from '../sarray';
import { logi } from '../importVars';

function sarrayTest(): void {
  logi(-7);
  const arr = newSArray<u32>(4);

  logi(-7);
}

export { sarrayTest };
