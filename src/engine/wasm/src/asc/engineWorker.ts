import { myAssert } from './myAssert';
import { sharedHeapInit } from './heapAlloc';
import { initMemManager, alloc, dealloc } from './memManager';
import { initAllocators } from './initAllocators';
import { Vec3, vec3Alloc } from './vec3';
// import { ObjectAllocator } from './objectAllocator';
import { range } from './utils';
import { clearBg } from './draw';
import { bgColor, heapOffset, numWorkers, workerIdx, logi, logf,
         frameWidth, frameHeight, frameBufferOffset, syncArrayOffset,
         sleepArrayOffset } from './importVars';
import { usePalette, imagesIndexOffset, numImages } from './importVars';
import { BitImage } from './bitImage';
import { initImages } from './initImages';
// import { DArray, newDArray, deleteDArray } from './darray';
import { Pointer } from './pointer';
import { SArray, newSArray } from './sarray';
import { test } from './test/test';

const syncLoc = syncArrayOffset + workerIdx * sizeof<i32>();
const sleepLoc = sleepArrayOffset + workerIdx * sizeof<i32>();

function init(): void {
  if (workerIdx == 0) {
    sharedHeapInit();
  }
}

function initWorkerMem(): void {
  initMemManager();
  initAllocators();
}

function run(): void {

  initWorkerMem();
  // test();
  logi(numImages);
  const images = initImages();
  for (let i = 0; i < images.length(); ++i) {
    const pixels = images.at(i).pixels;
    logi(<i32>pixels);
    const byte = load<u8>(pixels);
    logi(byte);
    logi(images.at(i).width);
    logi(images.at(i).height);
  }

  // const r = range(workerIdx, numWorkers, frameHeight);
  // const s = <u32>(r >>> 32);
  // const e = <u32>r;

  // while (true) {
  //   atomic.wait<i32>(syncLoc, 0);
  //   // const v = vec3Alloc.new();
  //   // clearBg(bgColor, s, e);
  //   atomic.store<i32>(syncLoc, 0);
  //   atomic.notify(syncLoc);
  //   break;
  // }

}


export { init, run };
