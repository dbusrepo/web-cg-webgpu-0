import { myAssert } from './myAssert';
import { ArenaAlloc, newArena } from './arenaAlloc';
import { logi } from './importVars';

type float = f32; // TODO

const VEC3_PER_BLOCK: u32 = 256;

let arena: ArenaAlloc<Vec3>;

class Vec3 {

  x: f32; // TODO use float type ?
  y: f32;
  z: f32;

  // constructor(public x: float = 0.0, public y: float = 0.0, public z: float = 0.0) {}
  private constructor() {}

  init(x: f32, y: f32, z: f32): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

function newVec3(x: f32, y: f32, z: f32): Vec3 {
  const p = arena.alloc();
  p.init(x, y, z)
  return p;
}

function delVec3(v: Vec3): void {
  arena.dealloc(v);
}

function initVec3(): void {
  arena = newArena<Vec3>(VEC3_PER_BLOCK);
}

initVec3();

export { float, Vec3, newVec3, delVec3 };
