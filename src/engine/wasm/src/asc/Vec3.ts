import { myAssert } from './myAssert';
import { alloc, dealloc } from './workerHeapAlloc';

type float = f32;

class Vec3 {
  static blockPtr: usize;
  x: f32;
  y: f32;
  z: f32;
  // w: float;
  // position, also color (r,g,b)
  // constructor(public x: float = 0.0, public y: float = 0.0, public z: float = 0.0) {}
  init(x: f32, y: f32, z: f32): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

function newVec3(x: f32, y: f32, z: f32): Vec3 {
  myAssert(true);
  const size = offsetof<Vec3>();
  Vec3.blockPtr += offsetof<Vec3>();
  const f: usize = alloc(size);
  const p = changetype<Vec3>(f);
  p.x = x; p.y = y; p.z = z;

  return p;
}

function deleteVec3(v: Vec3): void {
  const ptr = changetype<usize>(v);
  dealloc(ptr);
}

function initVec3(): void {

}

initVec3();


export { float, Vec3, newVec3, deleteVec3 };
