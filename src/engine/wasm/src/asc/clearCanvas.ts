declare const frameWidth: i32;
declare const pixelCount: i32;
// declare function log(i: i32, msg: string): void

export function clearCanvasVec(frameBufferOffset: i32, color: i32): void {
  // log(0, 'ciao from asc!'); // TODO la mem della stringa allocata da as
  // viene poi sovrascritta dal codice qui sotto. in js si assume infatti ke
  // il framebuffer parta da 0... quindi come si risolve sto casino?
  // allochiamo tutti i dati in ts ?
  // Altra nota: i colori in *memoria* come sequenza di byte sono RGBA: quindi
  // quando scrivi con splat 0xff_00_00_00 l'ff a sx finisce nel byte a dx
  // come alpha quindi e' il nero con alfa 255
  // let value = v128(0, 0, 0, <i8>255, 0, 0, 0, <i8>255, <i8>0, 0, 0, <i8>255, 0, 0, 0, <i8>255);
  let value = v128.splat<i32>(color);
  const limit = frameBufferOffset + pixelCount * 4;
  for (let i: i32 = frameBufferOffset; i != limit; i += 32) {
    v128.store(i, value);
    v128.store(i + 16, value);
  }
  // test first and last pixel
  // store<u32>(frameBufferOffset, 0xFF_00_00_FF);
  // store<u32>(frameBufferOffset + (pixelCount-1)*4, 0xFF_00_00_FF);
}

export function clearCanvasRows(
  frameBufferOffset: i32,
  color: i32,
  startRow: i32,
  endRow: i32,
): void {
  let value = v128.splat<i32>(color);
  const start: i32 = frameBufferOffset + startRow * frameWidth * 4;
  const end: i32 = frameBufferOffset + endRow * frameWidth * 4;
  for (let i = start; i != end; i += 32) {
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
