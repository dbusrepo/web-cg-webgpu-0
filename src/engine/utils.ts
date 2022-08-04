type Range = [start: number, end: number];

function range(
  workerIdx: number,
  numThreads: number,
  numElements: number,
): Range {
  const numTasks = (numElements / numThreads) | 0;
  const numTougherThreads = numElements % numThreads;

  const start =
    workerIdx < numTougherThreads
      ? workerIdx * (numTasks + 1)
      : numElements - (numThreads - workerIdx) * numTasks;

  const end = start + numTasks + Number(workerIdx < numTougherThreads);

  return [start, end];
}

function sleep(sleepArr: Int32Array, idx: number, timeoutMs: number): void {
  Atomics.wait(sleepArr, idx, 0, Math.max(1, timeoutMs | 0));
}

function syncStore(syncArr: Int32Array, idx: number, value: number): void {
  Atomics.store(syncArr, idx, value);
}

function syncWait(syncArr: Int32Array, idx: number, value: number): void {
  Atomics.wait(syncArr, idx, value);
}

function syncNotify(syncArr: Int32Array, idx: number): void {
  Atomics.notify(syncArr, idx);
}

export { syncStore, syncWait, syncNotify, sleep, range, Range };
