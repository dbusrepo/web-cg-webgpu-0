import { myAssert } from './myAssert';
import { logi } from './importVars';
import { ObjectAllocator, newObjectAllocator } from './objectAllocator';

const VEC3_BLOCK_SIZE: u32 = 256;

class Vec3 {

  x: f32;
  y: f32;
  z: f32;

  // constructor(public x: f32 = 0.0, public y: f32 = 0.0, public z: f32 = 0.0) {}
  private constructor() {}

  init(x: f32, y: f32, z: f32): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

let vec3Alloc: ObjectAllocator<Vec3>;

function newVec3(x: f32, y: f32, z: f32): Vec3 {
  const p = vec3Alloc.new();
  p.init(x, y, z)
  return p;
}

function initVec3Allocator(): void {
  vec3Alloc = newObjectAllocator<Vec3>(VEC3_BLOCK_SIZE);
}

export { Vec3, initVec3Allocator, vec3Alloc, newVec3 };
