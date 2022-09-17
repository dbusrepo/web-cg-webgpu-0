import { myAssert } from './myAssert';
import { allocInit, alloc, dealloc } from './workerHeapAlloc';
import { Vec3, newVec3, delVec3 } from './vec3';
import { range } from './utils';
import { clearBg } from './draw';
import { bgColor, heapOffset, numWorkers, workerIdx, logi, logf,
         frameWidth, frameHeight, frameBufferOffset, syncArrayOffset,
         sleepArrayOffset } from './importVars';
import { usePalette, imagesIndexOffset, numImages } from './importVars';
import { BitImage } from './bitImage';
import { loadImages } from './imagesLoader';
import { MyArray } from './myArray';
import { ObjectAllocator } from './objectAllocator';

const syncLoc = syncArrayOffset + workerIdx * sizeof<i32>();
const sleepLoc = sleepArrayOffset + workerIdx * sizeof<i32>();

function run(): void {

  // logi(<i32>process.hrtime());

  // if (workerIdx == 0) {
  //   store<u32>(imagesIndexOffset, 23);
  // }
  
  // logi(alignof<usize>());
  // logi(sizeof<usize>());

  // logi(usePalette);
  // logi(imagesIndexOffset);
  // logi(load<u32>(imagesIndexOffset));
  // logi(load<u32>(imagesIndexOffset+16));

  // logi(atomic.load<u32>(imagesIndexOffset));
  // logi(load<u8>(imagesIndexOffset+24));

  const imgsArr = loadImages();
  let image = changetype<BitImage>(imgsArr);
  // logi(image.pixels);
  logi(load<u8>(image.pixels));
  // image = changetype<BitImage>(imgsArr + BitImage.size);
  // logi(image.pixels);

  const r = range(workerIdx, numWorkers, frameHeight);
  const s = <u32>(r >>> 32);
  const e = <u32>r;

  while (true) {
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
