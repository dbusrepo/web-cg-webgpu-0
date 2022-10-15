import { myAssert } from './myAssert';
import { logi, logf, frameBufferPtr, frameWidth, frameHeight } from './importVars';
import { FONT_X_SIZE, FONT_Y_SIZE, FONT_SPACING } from './importVars';
import { stringsDataPtr, fontCharsPtr } from './importVars';

const PIX_OFFS = 4;
const FRAME_ROW_LEN = frameWidth * PIX_OFFS;

function clearBg(
  color: u32,
  start: u32,
  end: u32,
): void {

  const startOff: usize = frameBufferPtr + start * FRAME_ROW_LEN;
  const endOff: usize = frameBufferPtr + end * FRAME_ROW_LEN;

  // let value = v128.splat<i32>(color);
  // TODO check bounds ?
  // for (let i = startOff; i < endOff; i += 32) {
  //   v128.store(i, value);
  //   v128.store(i + 16, value);
  // }

  // TODO handle remainder elements here ?

  for (let ptr = startOff; ptr < endOff; ptr += PIX_OFFS) {
    store<u32>(ptr, color);
  }

  // test first and last pixel
  // store<u32>(frameBufferPtr, 0xFF_00_00_FF);
  // store<u32>(frameBufferPtr + (pixelCount-1)*4, 0xFF_00_00_FF);
}

// export function clearCanvasVec(frameBufferPtr: i32): void {
//     const value = 0xff_00_00_00;
//     let limit = frameBufferPtr + pixelCount*4;
//     for (let i: i32 = frameBufferPtr; i != limit; i+=16) {
//         store<u32>(i, value);
//         store<u32>(i+4, value);
//         store<u32>(i+8, value);
//         store<u32>(i+12, value);
//     }
// }

function drawText(textOffs: usize, x: i32, y: i32, color: u32): void {
  myAssert(FONT_X_SIZE == 8);
  let rowPtr: usize = frameBufferPtr + x * PIX_OFFS + y * FRAME_ROW_LEN;
  for (let font_y = usize(0); font_y != FONT_Y_SIZE; font_y++) {
    const bmpRowYPtr = fontCharsPtr + font_y;
    let pixPtr = rowPtr;
    let chPtr = stringsDataPtr + textOffs;
    let ch: u8;
    while (ch = load<u8>(chPtr++)) {
      const chBmpRowY = load<u8>(bmpRowYPtr + ch * FONT_Y_SIZE);
      for (let font_x = usize(0), curBit: u8 = 0x80; font_x != FONT_X_SIZE; font_x++, curBit >>= 1) {
        if (chBmpRowY & curBit) {
          store<u32>(pixPtr, color);
        }
        pixPtr += PIX_OFFS;
      }
      pixPtr += FONT_SPACING * PIX_OFFS;
    }
    rowPtr += FRAME_ROW_LEN;
  }
}

export { clearBg, drawText }
