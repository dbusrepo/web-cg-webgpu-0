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

// assert
declare function myAssert(c: boolean): void;

// alloc
declare function allocInit(): void;
declare function alloc(size: usize): usize;
declare function dealloc(blockPtr: usize): void;

// utils
declare function range(workerIdx: u32, numWorkers: u32, numTasks: u32): u64;

// draw
declare function clearBg(c: i32, s: i32, e: i32): void;

/**********************************************************************/

// export const syncArr = memory.data(16);

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

// @unmanaged
class Vec {
    x: float;
    y: float;
    z: float;
    // w: float;
    // position, also color (r,g,b)
    // constructor(public x: float = 0.0, public y: float = 0.0, public z: float = 0.0) {}
}

// @global function __new(size: usize, id: u32): usize {
//   logi(<i32>size);
//   return 0;
// }

let startOff: usize = __heap_base;

function memAlloc(size: usize): usize {
  logi(size);
  const asd = startOff;
  startOff += size;
  return asd;
}

// export function instantiateRaw<T>(): T {
//     // when field is class with nonnull, it's unsafe.
//     if (isReference<T>()) {
//         return changetype<T>(__new(offsetof<T>(), idof<T>()));
//     }
//     // It's safe.
//     return instantiate<T>();
// }

export function newVec(val: f32): Vec {
  const addr = memAlloc(offsetof<Vec>());
  logi(addr);
  const vec = changetype<Vec>(addr);
  vec.x = val;
  // logf(vec.x);
  return vec;
  // return new Vec();
}

// TODO remove
function newTypeArr32u(size: usize): Uint32Array {
  const addr = memAlloc(size * 4);
  logi(addr);
  const vec = changetype<Uint32Array>(addr);
  return vec;
}

// // Let's utilize the entire heap as our image buffer
// const offset = __heap_base;
// var TOP = offset + 8;

// store<usize>(offset, TOP);

// export function __allocator_get_offset(): usize {
//   return atomic.load<usize>(offset);
// }

// export function __memory_allocate(size: usize): usize {
//   log(__heap_base);
//   return 0;
// }

// const v = new Vec(1,2,3);


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

function run(): void {
  const r = range(workerIdx, numWorkers, frameHeight);
  const s = <i32>(r >>> 32);
  const e = <i32>r;
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

  // const f: usize = alloc(1);
  // const g: usize = alloc(3);
  // const h: usize = alloc(2);
  // logi(f);
  // logi(g);
  // logi(h);
  // dealloc(g);
  // const z: usize = alloc(2);
  // logi(z);

  while (true) {
    atomic.wait<i32>(syncLoc, 0);
    clearBg(bgColor, s, e); // TODO fix range
    atomic.store<i32>(syncLoc, 0);
    atomic.notify(syncLoc);
    break;
  }
}

function init(): void {
  logi(heapOffset);
  allocInit();
}

export { init, run };
