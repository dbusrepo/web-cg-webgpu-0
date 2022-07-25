import { WasmData } from './initWasm';
import { Range } from './common';

function clearBg(
  wasmData: WasmData,
  range: Range,
): void {

  // const frameBufferOffset = wasmData.memOffsets[FRAME_BUF_IDX];
  // this._wasmData.ascExports.clearCanvasVec(frameBufferOffset, 0xFF_00_00_00);

  // const color = (this._workerIdx & 1) ? 0xFF_00_00_00 : 0xFF_00_00_FF;
  wasmData.ascExports.draw.clearBg(
    // 0xff_00_00_00,
    0xff_ff_00_00,
    range[0],
    range[1],
  );

  // js version. TODO: fix plz
  // const frameUi32 = new Uint32Array(this._wasmData.ui8cFramebuffer.buffer);
  // const limit = this._pixelCount;
  // for (let i = 0; i !== limit; i += 1) {
  //   // canvas_mem[] = 0xff_ff_00_00;
  //   frameUi32[i] = 0xff_00_00_00;
  // }
}

export { clearBg };
