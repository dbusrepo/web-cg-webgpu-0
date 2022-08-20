import { logi, logf, frameBufferOffset, frameWidth, frameHeight } from './importVars';

function clearBg(
  color: i32,
  start: u32,
  end: u32,
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

export { clearBg }
