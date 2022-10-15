import { myAssert } from './myAssert';
import { sharedHeapInit } from './heapAlloc';
import { initMemManager, alloc, dealloc } from './memManager';
import { initAllocators } from './initAllocators';
import { Vec3, vec3Alloc } from './vec3';
// import { ObjectAllocator } from './objectAllocator';
import { range } from './utils';
import * as draw from './draw';
import { bgColor, heapPtr, numWorkers, workerIdx, logi, logf,
         frameWidth, frameHeight, frameBufferPtr, syncArrayPtr,
         sleepArrayPtr } from './importVars';
import { BitImage } from './bitImage';
import { initImages } from './initImages';
// import { DArray, newDArray, deleteDArray } from './darray';
import { Pointer } from './pointer';
import { SArray, newSArray } from './sarray';
import { test } from './test/test';
import {PTR_T} from './memUtils';
import { MYIMG, IMG1 } from './importImages';

import { usePalette, imagesIndexPtr, imagesIndexSize, imagesDataSize, imagesDataPtr, numImages } from './importVars';
import { stringsDataPtr, stringsDataSize } from './importVars';
import { fontCharsPtr, fontCharsSize } from './importVars';
import * as strings from './importStrings';

const syncLoc = syncArrayPtr + workerIdx * sizeof<i32>();
const sleepLoc = sleepArrayPtr + workerIdx * sizeof<i32>();

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

  // logi(strings.MSG1);
  // logi(strings.SENT2);
  // logi(strings.SENT3);

  // logi(load<u8>(fontCharsPtr + 65*8));

  // logi(load<u8>(stringsDataPtr));
  // logi(load<u8>(stringsDataPtr+1));
  // logi(load<u8>(stringsDataPtr+2));
  // logi(load<u8>(stringsDataPtr+3));
  // logi(load<u8>(stringsDataPtr+4));

  // logi(stringsIndexPtr);
  // logi(stringsIndexSize);
  // logi(stringsDataPtr);
  // logi(stringsDataSize);

  // logi(fontCharsPtr);
  // logi(fontCharsSize);

  // logi(usePalette);
  // logi(imagesIndexPtr);
  // logi(imagesIndexSize);
  // logi(imagesDataPtr);
  // logi(imagesDataSize);
  // logi(numImages);

  // logi(MYIMG);
  // logi(imagesIndexSize);

  // test();
  // test images loading
  // logi(numImages);
  // const images = initImages();
  // for (let i = 0; i < images.length(); ++i) {
  //   const pixels = images.at(i).pixels;
  //   logi(<i32>pixels);
  //   const byte = load<u8>(pixels);
  //   logi(byte);
  //   logi(images.at(i).width);
  //   logi(images.at(i).height);
  // }

  const images = initImages();
  const image = images.at(0);

  // const width = image.width;
  // const height = image.height;

  // let screenPtr: PTR_T;
  // let pixels: PTR_T;

  // logi(imagesIndexOffset);
  // logi(image.pixels);
  // logi(image.width);
  // logi(image.height);
  // for (let i = 0; i != frameHeight; ++i) {
  //   let screenPtr: PTR_T = frameBufferPtr + i * frameWidth * 4;
  //   const pixels: PTR_T = image.pixels + i * image.width * 4;
  //   memory.copy(screenPtr, pixels, frameWidth * 4);

  //   // screenPtr = frameBufferPtr + i * frameWidth * 4;
  //   // pixels = image.pixels + i * image.width * 4;
  //   // // logi(screenPtr);
  //   // for (let j = 0; j != frameWidth; ++j) {
  //   //   const col = load<u32>(pixels);
  //   //   store<u32>(screenPtr, col);
  //   //   // store<i32>(screenPtr, 0xFF_00_00_FF);
  //   //   pixels += 4;
  //   //   screenPtr += 4;
  //   //   // logi(j);
  //   // }
  // }

  // const r = range(workerIdx, numWorkers, frameHeight);
  // const s = <u32>(r >>> 32);
  // const e = <u32>r;

  while (true) {
    atomic.wait<i32>(syncLoc, 0);
    // const v = vec3Alloc.new();
    // clearBg(bgColor, s, e);

    // // logi(image.height);
    // for (let i = 0; i != frameHeight; ++i) {
    //   let screenPtr: PTR_T = frameBufferPtr + i * frameWidth * 4;
    //   const pixels: PTR_T = image.pixels + i * image.width * 4;
    //   memory.copy(screenPtr, pixels, frameWidth * 4);
    // }

    draw.drawText(strings.MSG1, 10, 199, 0xFF_00_00_FF);

    atomic.store<i32>(syncLoc, 0);
    atomic.notify(syncLoc);
    break;
  }

}


export { init, run };
