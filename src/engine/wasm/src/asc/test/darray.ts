import { myAssert } from '../myAssert';
import { DArray, newDArray, deleteDArray } from '../darray';
import { GET_PTR, ilog2, nextPowerOfTwo, isSizePowerTwo, PTR_T, NULL_PTR, getTypeSize, getTypeAlignMask, SIZE_T } from '../memUtils';
import { Pointer } from '../Pointer';
import { Vec3, vec3Alloc, newVec3 } from '../vec3';
import { logi, logf } from '../importVars';
import {alloc} from '../memManager';
import { Ref } from '../ref';

function darrayTest(): void {
  logi(-7);

  logi(-7);
}

export { darrayTest };

