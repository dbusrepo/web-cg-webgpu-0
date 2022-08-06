type Range = [start: number, end: number];

// split [0..numTasks-1] between [0..numWorkers-1] workers and get the index
// range for worker workerIdx. Workers on head get one more task if needed.
function range(workerIdx: number, numWorkers: number, numTasks: number): Range {
  const numTaskPerWorker = (numTasks / numWorkers) | 0;
  const numTougherThreads = numTasks % numWorkers;
  const isTougher = workerIdx < numTougherThreads;

  const start = isTougher
    ? workerIdx * (numTaskPerWorker + 1)
    : numTasks - (numWorkers - workerIdx) * numTaskPerWorker;

  const end = start + numTaskPerWorker + Number(isTougher);

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
