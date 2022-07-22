import * as wasm from './initWasm';

const FRAME_BUF_IDX = wasm.MemoryRegionNames
  .FRAMEBUFFER as wasm.MemRegionNameType;

const NUM_BYTES_DWORD = 4;

type Range = [start: number, end: number];

function getRange(
  workerIdx: number,
  numElements: number,
  numThreads: number,
): Range {
  const numTasks = (numElements / numThreads) | 0;
  const numTougherThreads = numElements % numThreads;

  const start =
    workerIdx < numTougherThreads
      ? workerIdx * (numTasks + 1)
      : numElements - (numThreads - workerIdx) * numTasks;

  const end = start + numTasks + +(workerIdx < numTougherThreads);

  return [start, end];
}

function clearBackgroundWasm(
  wasmData: wasm.WasmOutDataType,
  rowRange: Range,
): void {
  const frameBufferOffset = wasmData.memRegOffs[FRAME_BUF_IDX];
  // this._wasmData.ascExports.clearCanvasVec(frameBufferOffset, 0xFF_00_00_00);

  // const color = (this._workerIdx & 1) ? 0xFF_00_00_00 : 0xFF_00_00_FF;
  wasmData.ascExports.clearCanvasRows(
    frameBufferOffset,
    0xff_00_00_00,
    rowRange[0],
    rowRange[1],
  );

  // js version. TODO: fix plz
  // const frameUi32 = new Uint32Array(this._wasmData.ui8cFramebuffer.buffer);
  // const limit = this._pixelCount;
  // for (let i = 0; i !== limit; i += 1) {
  //   // canvas_mem[] = 0xff_ff_00_00;
  //   frameUi32[i] = 0xff_00_00_00;
  // }
}

function atomicSleep(sleepArr: Int32Array, timeoutMs: number): void {
  Atomics.wait(sleepArr, 0, 0, Math.max(1, timeoutMs | 0));
}

export { atomicSleep, getRange, Range, NUM_BYTES_DWORD, clearBackgroundWasm };
