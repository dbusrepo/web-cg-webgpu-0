@external('env', 'logi')
export declare function logi(i: i32): void;

@external('env', 'logf')
export declare function logf(i: f32): void;

@external('env', 'workerIdx')
export declare const workerIdx: u32;

@external('env', 'workersHeapOffset')
export declare const workersHeapOffset: usize;

@external('env', 'workerHeapSize')
export declare const workerHeapSize: u32;

@external('env', 'heapOffset')
export declare const heapOffset: usize;

@external('env', 'frameBufferOffset')
export declare const frameBufferOffset: i32;

@external('env', 'frameWidth')
export declare const frameWidth: i32;

@external('env', 'frameHeight')
export declare const frameHeight: i32;

@external('env', 'syncArrayOffset')
export declare const syncArrayOffset: i32;

@external('env', 'sleepArrayOffset')
export declare const sleepArrayOffset: i32;

@external('env', 'numWorkers')
export declare const numWorkers: i32;

@external('env', 'bgColor')
export declare const bgColor: i32;
