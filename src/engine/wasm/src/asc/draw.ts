declare const frameBufferOffset: i32;
declare const frameWidth: i32;
declare const frameHeight: i32;

// declare function log(i: i32, msg: string): void
declare function log_i32(i: i32): void;

// export function clearBg(frameBufferOffset: i32, color: i32): void {
  // log(0, 'ciao from asc!'); // TODO la mem della stringa allocata da as
  // viene poi sovrascritta dal codice qui sotto. in js si assume infatti ke
  // il framebuffer parta da 0... quindi come si risolve sto casino?
  // allochiamo tutti i dati in ts ?
  // Altra nota: i colori in *memoria* come sequenza di byte sono RGBA: quindi
  // quando scrivi con splat 0xff_00_00_00 l'ff a sx finisce nel byte a dx
  // come alpha quindi e' il nero con alfa 255
  // let value = v128(0, 0, 0, <i8>255, 0, 0, 0, <i8>255, <i8>0, 0, 0, <i8>255, 0, 0, 0, <i8>255);
  // let value = v128.splat<i32>(color);
  // const limit = frameBufferOffset + pixelCount * 4;
  // for (let i: i32 = frameBufferOffset; i != limit; i += 32) {
  //   v128.store(i, value);
  //   v128.store(i + 16, value);
  // }
  // test first and last pixel
  // store<u32>(frameBufferOffset, 0xFF_00_00_FF);
  // store<u32>(frameBufferOffset + (pixelCount-1)*4, 0xFF_00_00_FF);
// }

type float = f64;

// export class Vec {
//     // position, also color (r,g,b)
//     constructor(public x: float = 0.0, public y: float = 0.0, public z: float = 0.0) {}
// }

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

// export function printValues(): void {
//   // log(ASC_MEMORY_BASE);
//   // log(memory.size()); //<<16);
//   // log(i32(__data_end));
//   // log(calcValue());
//   // log(heap.alloc(10));
// }

export function clearBg(
  color: i32,
  start: i32,
  end: i32,
): void {

  let value = v128.splat<i32>(color);
  const startOff: i32 = frameBufferOffset + start * frameWidth * 4;
  const endOff: i32 = frameBufferOffset + end * frameWidth * 4;
  // TODO check bounds ?
  for (let i = startOff; i != endOff; i += 32) {
    v128.store(i, value);
    v128.store(i + 16, value);
  }

  // TODO handle remainder elements here ?

  // test first and last pixel
  // store<u32>(frameBufferOffset, 0xFF_00_00_FF);
  // store<u32>(frameBufferOffset + (pixelCount-1)*4, 0xFF_00_00_FF);
}

// export function clearCanvasVec(frameBufferOffset: i32): void {
//     const value = 0xff_00_00_00;
//     let limit = frameBufferOffset + pixelCount*4;
//     for (let i: i32 = frameBufferOffset; i != limit; i+=16) {
//         store<u32>(i, value);
//         store<u32>(i+4, value);
//         store<u32>(i+8, value);
//         store<u32>(i+12, value);
//     }
// }
