import { myAssert } from './myAssert';
import { allocInit, alloc, dealloc } from './workerHeapAlloc';
import { Vec3, newVec3, deleteVec3 } from './Vec3';
import { range } from './utils';
import { clearBg } from './draw';

import { bgColor, heapOffset, numWorkers, workerIdx, logi, logf,
         frameWidth, frameHeight, frameBufferOffset, syncArrayOffset, 
         sleepArrayOffset } from './env';

/**********************************************************************/

const syncLoc = syncArrayOffset + workerIdx * sizeof<i32>();
const sleepLoc = sleepArrayOffset + workerIdx * sizeof<i32>();
// const heapLoc = heapOffset + workerIdx * workerHeapSize;

/**********************************************************************/

function testVec3(): Vec3 {
  // const f: usize = alloc(16);
  // const p = changetype<Vec3>(f);
  // p.init(3, 4, 5);
  // return p;
  // return Vec3.new(3, 4, 5);
  const v = newVec3(3, 4, 5);
  v.init(7,2,3);
  return v;
}

function run(): void {

  // logi(<i32>process.hrtime());

  const r = range(workerIdx, numWorkers, frameHeight);
  const s = <i32>(r >>> 32);
  const e = <i32>r;

  const v = testVec3();
  logf(v.x);
  // Vec3.delete(v);

  // logi(s);
  // logi(e);
  // logi(heapOffset);
  // logi(workerHeapSize);
  // logi(heapLoc);
  // logi(__heap_base);
  // logi(alloc(10));
  // logi(alloc(12));
  // logi(alloc(1024));
  // logi(alloc(1024));
  // const addr = alloc(4);
  // logi(load<u32>(addr));
  // logi(alloc(1));
  // printValues();

  // const f: usize = alloc(12);
  // // const g: usize = alloc(2);
  // // const h: usize = alloc(3);
  // logi(f);

  // const g: usize = alloc(5);
  // logi(g);
  // dealloc(f);
  // // dealloc(g);

  // const h: usize = alloc(7);
  // logi(h);

  // logi(-1);
  // dealloc(h);
  // logi(-1);
  // dealloc(g);
  // logi(-1);
  // const z: usize = alloc(2);
  // logi(z);
  // logi(-1);

    // if (workerIdx > 0) {
    //   // const a = alloc(256);
    // }

  logi(-1);

  while (true) {
    // const f: usize = alloc(12);
    // // const g: usize = alloc(2);
    // // const h: usize = alloc(3);
    // logi(f);
    // // logi(g);
    // // logi(h);
    // const g: usize = alloc(5);
    // logi(g);
    // dealloc(f);
    // dealloc(g);

    // const h: usize = alloc(7);
    // dealloc(h);
    // logi(h);

    // const a = alloc(77);
    // if (workerIdx <= 0) {
    // const a = alloc(12);
    // }
    atomic.wait<i32>(syncLoc, 0);
    clearBg(bgColor, s, e);
    atomic.store<i32>(syncLoc, 0);
    atomic.notify(syncLoc);
    break;
  }
}

function init(): void {
  // logi(heapOffset);
  allocInit();
}

export { init, run };
