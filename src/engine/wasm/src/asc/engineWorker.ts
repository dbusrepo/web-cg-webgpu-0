import { myAssert } from './myAssert';
import { initModules } from './initModules';
import { allocInit, alloc, dealloc } from './workerHeapAlloc';
import { Vec3, vec3Alloc } from './vec3';
// import { ObjectAllocator } from './objectAllocator';
import { range } from './utils';
import { clearBg } from './draw';
import { bgColor, heapOffset, numWorkers, workerIdx, logi, logf,
         frameWidth, frameHeight, frameBufferOffset, syncArrayOffset,
         sleepArrayOffset } from './importVars';
import { usePalette, imagesIndexOffset, numImages } from './importVars';
import { BitImage } from './bitImage';
// import { loadImages } from './imagesLoader';
import { Vector, newVector, deleteVector } from './vector';
import { Pointer } from './pointer';

const syncLoc = syncArrayOffset + workerIdx * sizeof<i32>();
const sleepLoc = sleepArrayOffset + workerIdx * sizeof<i32>();

function run(): void {

  initModules();

  logi(offsetof<Pointer<usize>>());

  let arr = newVector<u32>(2);
  // logi(arr.length);
  logi(arr.start);
  // arr[0] = 3;
  logi(arr[1]);
  // // // logi(arr.end);
  // logi(changetype<usize>(arr.atIdx(0)));
  // logi(changetype<usize>(arr.atIdx(1)));
  // // deleteVector(arr);

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

  // const imgsArr = loadImages();
  // let image = changetype<BitImage>(imgsArr);
  // logi(image.pixels);
  // logi(load<u8>(image.pixels));
  // image = changetype<BitImage>(imgsArr + BitImage.size);
  // logi(image.pixels);

  // let v = vec3Alloc.new();
  // v = vec3Alloc.new();
  // v.init(3, 4, 5);
  // logf(v.x);

  const r = range(workerIdx, numWorkers, frameHeight);
  const s = <u32>(r >>> 32);
  const e = <u32>r;

  // clearBg(0xFF_00_00_FF, s, e);
  // let v = vec3Alloc.new();
  // v = vec3Alloc.new();

  while (true) {
    atomic.wait<i32>(syncLoc, 0);
    const v = vec3Alloc.new();
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
