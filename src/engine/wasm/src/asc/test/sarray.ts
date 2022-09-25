import { myAssert } from '../myAssert';
import { SArray, newSArray, deleteSArray } from '../sarray';
import { GET_PTR, ilog2, nextPowerOfTwo, isSizePowerTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from '../memUtils';
import { Pointer } from '../Pointer';
import { Vec3, vec3Alloc, newVec3 } from '../vec3';
import { logi, logf } from '../importVars';
import {alloc} from '../memManager';
import { Ref } from '../ref';

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

  logi(-7);
}

export { sarrayTest };
