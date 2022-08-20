import { myAssert } from './myAssert';
import { allocInit, alloc, dealloc } from './workerHeapAlloc';
import { Vec3, newVec3, delVec3 } from './vec3';
import { range } from './utils';
import { clearBg } from './draw';
import { bgColor, heapOffset, numWorkers, workerIdx, logi, logf,
         frameWidth, frameHeight, frameBufferOffset, syncArrayOffset,
         sleepArrayOffset } from './importVars';

const syncLoc = syncArrayOffset + workerIdx * sizeof<i32>();
const sleepLoc = sleepArrayOffset + workerIdx * sizeof<i32>();

function run(): void {

  // logi(<i32>process.hrtime());

  const r = range(workerIdx, numWorkers, frameHeight);
  const s = <u32>(r >>> 32);
  const e = <u32>r;

  while (true) {
    atomic.wait<i32>(syncLoc, 0);
    clearBg(bgColor, s, e);
    atomic.store<i32>(syncLoc, 0);
    atomic.notify(syncLoc);
  }
}

function init(): void {
  // logi(heapOffset);
  allocInit();
}

export { init, run };
