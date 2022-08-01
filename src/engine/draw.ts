import { WasmModules } from './initWasm';
import { Range } from '../common';

// RGBA as ABGR

function clearBg(wasmModules: WasmModules, color: number, range: Range): void {
  // const color = (this._workerIdx & 1) ? 0xFF_00_00_00 : 0xFF_00_00_FF;
  wasmModules.asc.draw.clearBg(color, range[0], range[1]);

  // js version. TODO: fix plz
  // const frameUi32 = new Uint32Array(this._wasmData.ui8cFramebuffer.buffer);
  // const limit = this._pixelCount;
  // for (let i = 0; i !== limit; i += 1) {
  //   // canvas_mem[] = 0xff_ff_00_00;
  //   frameUi32[i] = 0xff_00_00_00;
  // }
}

export { clearBg };
