const LOCK_ITER_LIMIT: i32 = 64;

function lock(addr: usize): void {
    var stat = 0;
    for (let i = 0; i < LOCK_ITER_LIMIT; i++) {
      stat = atomic.cmpxchg<i32>(addr, 0, 1)
      if (!stat) break;
    }
    if (stat == 1) {
      stat = atomic.xchg<i32>(addr, 2);
    }
    while (stat) {
      atomic.wait<i32>(addr, 0, 2);
      stat = atomic.xchg<i32>(addr, 2);
    }
}

function unlock(addr: usize): void {
  if (atomic.load<i32>(addr) == 2) {
    atomic.store<i32>(addr, 0);
  }
  else if (atomic.xchg<i32>(addr, 0) == 1) {
    return;
  }
  for (let i = 0; i < LOCK_ITER_LIMIT; i++) {
    if (atomic.load<i32>(addr) != 0 && atomic.cmpxchg<i32>(addr, 1, 2)) return;
  }
  atomic.notify(addr, 1);
}

export { lock, unlock };
