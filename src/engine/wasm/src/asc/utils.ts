
function gcd(m: i32, n: i32): i32 {
  let tmp: i32;
  while (m != 0) {
    tmp = m;
    m = n % m;
    n = tmp;
  }
  return n;
}

function lcm(m: i32, n: i32): i32 {
    return Math.floor(m / gcd(m, n)) * n;
} 

// split [0..numTasks-1] between [0..numWorkers-1] and get the index
// range for worker workerIdx in a 64 bit var. Workers on head get one more task if needed.
function range(workerIdx: u32, numWorkers: u32, numTasks: u32): u64 {
  const numTaskPerWorker = numTasks / numWorkers;
  const numTougherThreads = numTasks % numWorkers;
  const isTougher = workerIdx < numTougherThreads;

  const start = isTougher ?
    workerIdx * (numTaskPerWorker + 1) :
    numTasks - (numWorkers - workerIdx) * numTaskPerWorker;

  const end = start + numTaskPerWorker + (isTougher ? 1 : 0);
  // TODO
  return (start as u64) << 32 | end;
}

export { gcd, lcm, range };
