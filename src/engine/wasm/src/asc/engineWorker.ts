declare const frameWidth: i32;
declare const frameHeight: i32;
declare const frameBufferOffset: i32;
declare const syncArrayOffset: i32;
declare const sleepArrayOffset: i32;
declare const workerIdx: i32;
declare function clearBg(c: i32, s: i32, e: i32): void;
declare function log_i32(i: i32): void;

const syncLoc = syncArrayOffset + workerIdx * sizeof<i32>();
const sleepLoc = sleepArrayOffset + workerIdx * sizeof<i32>();

function run(): void {
  // log_i32();
  while (true) {
    atomic.wait<i32>(syncLoc, 0);
    clearBg(0xff0000ff, 0, 200); // TODO fix range
    atomic.store<i32>(syncLoc, 0);
    atomic.notify(syncLoc);
  }
}

export { run };
