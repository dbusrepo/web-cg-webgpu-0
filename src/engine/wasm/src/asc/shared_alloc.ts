declare function logi(i: i32): void;

// declare const workerIdx: i32;

const ALIGN_BITS: u32 = 3;
const ALIGN_SIZE: usize = 1 << <usize>ALIGN_BITS;
const ALIGN_MASK: usize = ALIGN_SIZE - 1;

const HEAP_BASE = __heap_base;
var HEAP_START: usize = (HEAP_BASE + ALIGN_MASK) & ~ALIGN_MASK;
var HEAP_PTR: usize = HEAP_START;
