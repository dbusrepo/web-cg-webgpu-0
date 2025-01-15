import { getTypeSize, PTR_T } from './memUtils';

type LOCK_T = i32;

const LOCK_ITER_LIMIT: i32 = 64;

function lock(addr: PTR_T): void {
    var stat = 0;
    for (let i = 0; i < LOCK_ITER_LIMIT; i++) {
      stat = atomic.cmpxchg<LOCK_T>(addr, 0, 1)
      if (!stat) break;
    }
    if (stat == 1) {
      stat = atomic.xchg<LOCK_T>(addr, 2);
    }
    while (stat) {
      atomic.wait<LOCK_T>(addr, 0, 2);
      stat = atomic.xchg<LOCK_T>(addr, 2);
    }
}

function unlock(addr: PTR_T): void {
  if (atomic.load<LOCK_T>(addr) == 2) {
    atomic.store<LOCK_T>(addr, 0);
  }
  else if (atomic.xchg<LOCK_T>(addr, 0) == 1) {
    return;
  }
  for (let i = 0; i < LOCK_ITER_LIMIT; i++) {
    if (atomic.load<LOCK_T>(addr) != 0 && atomic.cmpxchg<LOCK_T>(addr, 1, 2)) return;
  }
  atomic.notify(addr, 1);
}

export { LOCK_T, lock, unlock };
