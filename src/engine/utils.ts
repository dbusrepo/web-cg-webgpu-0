import { Range } from './common';
// import * as wasm from './initWasm';

// const FRAME_BUF_IDX = wasm.MemoryRegion.FRAMEBUFFER;

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

function atomicSleep(sleepArr: Int32Array, timeoutMs: number): void {
  Atomics.wait(sleepArr, 0, 0, Math.max(1, timeoutMs | 0));
}

export { atomicSleep, getRange, Range };
