import { myAssert } from './myAssert';
import { Vec3 } from './Vec3';

// env
declare function logf(i: f32): void;
declare function logi(i: i32): void;

declare const frameWidth: i32;
declare const frameHeight: i32;
declare const frameBufferOffset: i32;
declare const syncArrayOffset: i32;
declare const sleepArrayOffset: i32;
declare const workerIdx: i32;
declare const numWorkers: i32;
declare const heapOffset: usize;
declare const bgColor: i32;

// worker heap alloc
declare function alloc(size: usize): usize;
declare function dealloc(blockPtr: usize): void;

// shared heap alloc
declare function heapAllocInit(): void;

// utils
declare function range(workerIdx: u32, numWorkers: u32, numTasks: u32): u64;

// draw
declare function clearBg(c: i32, s: i32, e: i32): void;

// Vec3
declare function newVec3(x: f32, y: f32, z: f32): Vec3;
declare function deleteVec3(v: Vec3): void;

/**********************************************************************/

const syncLoc = syncArrayOffset + workerIdx * sizeof<i32>();
const sleepLoc = sleepArrayOffset + workerIdx * sizeof<i32>();
// const heapLoc = heapOffset + workerIdx * workerHeapSize;

/**********************************************************************/

type float = f32;

/**********************************************************************/

// function _new<T>(): T {
//   assert(isReference<T>());
//   const size = offsetof<T>();
//   // logi(addr);
//   const addr = alloc(size);
//   // logi(addr);
//   return changetype<T>(addr);
// }

// const v = _new<Vec>();
// logi(changetype<usize>(v));

// class Vec3 {
//     x: float;
//     y: float;
//     z: float;
//     // w: float;
//     // position, also color (r,g,b)
//     // constructor(public x: float = 0.0, public y: float = 0.0, public z: float = 0.0) {}
//     init(x: float, y: float, z: float): void {
//       this.x = x;
//       this.y = y;
//       this.z = z;
//     }

//     static new(x: float, y: float, z: float): Vec3 {
//       const size = offsetof<Vec3>();
//       const f: usize = alloc(size);
//       const p = changetype<Vec3>(f);
//       p.x = x; p.y = y; p.z = z;
//       return p;
//     }

//     static delete(v: Vec3): void {
//       const ptr = changetype<usize>(v);
//       dealloc(ptr);
//     }
// }

// @global function __new(size: usize, id: u32): usize {
//   logi(<i32>size);
//   return 0;
// }

// export function instantiateRaw<T>(): T {
//     // when field is class with nonnull, it's unsafe.
//     if (isReference<T>()) {
//         return changetype<T>(__new(offsetof<T>(), idof<T>()));
//     }
//     // It's safe.
//     return instantiate<T>();
// }

function printValues(): void {

  // const myArr = new StaticArray<i32>(100);
  // logi(memory.grow(1));

  // logi(<i32>heap.alloc(16));
  // logi(sleepArr);
  
  // NativeMathf.seed

  // logi(syncLoc);

  // logi(ASC_MEMORY_BASE);
  // const myblock = heap.alloc(16);
  // logi(memory.size()); //<<16);
  logi(i32(__data_end));
  logi(<i32>__heap_base);
  // logi(<i32>myblock);
  // log(heap.alloc(10));
}

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
    // // dealloc(h);
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
  heapAllocInit();
}

export { init, run };
