import { myAssert } from '../myAssert';
import { SArray, newSArray, deleteSArray } from '../sarray';
import { ilog2, nextPowerOfTwo, isSizePowerTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from '../memUtils';
import { Pointer } from '../Pointer';
import { Vec3, vec3Alloc, newVec3 } from '../vec3';
import { logi, logf } from '../importVars';
import {alloc} from '../memManager';

function sarrayTest(): void {
  logi(-7);
  // const arr = newSArray<u32>(4);
  // logi(changetype<PTR_T>(arr));
  // logi(changetype<PTR_T>(arr) & 3);
  // const arr = newSArray<u32>(4, 3);
  // logi(changetype<PTR_T>(arr));
  // logi(changetype<PTR_T>(arr) & 7);
  // const arr = newSArray<u32>(4, 4);
  // logi(changetype<PTR_T>(arr));
  // logi(changetype<PTR_T>(arr) & 15);

  // const arr = newSArray<u32>(4, 2);
  // // @ts-ignore
  // arr[0] = 1;
  // // @ts-ignore
  // arr[1] = 2;
  // // @ts-ignore
  // logi(arr[1]);

  // const v0 = newVec3(1,2,3);
  const v0 = vec3Alloc.new();
  // logi(changetype<PTR_T>(v0))
  v0.x = 34;
  logf(v0.x);
  const v1 = vec3Alloc.new();
  // logi(changetype<PTR_T>(v1))
  logf(v1.x);

  logi(-7);
}

export { sarrayTest };
