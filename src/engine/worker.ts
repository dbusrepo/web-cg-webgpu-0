import * as wasm from './initWasm';
import { atomicSleep, getRange } from './utils';
import { Range } from './common';

type WorkerConfig = {
  idx: number;
  numWorkers: number;
  wasmMemory: WebAssembly.Memory;
  syncArrBuffer: SharedArrayBuffer;
  wasmInData: wasm.WasmInput;
};

class Worker {
  private _numWorkers: number;
  private _workerIdx: number;
  private _wasmInData: wasm.WasmInput;
  private _wasmMemory: WebAssembly.Memory;
  private _syncArr: Int32Array;
  private _sleepArr: Int32Array;
  private _rowRange: Range;

  private _wasmData: wasm.WasmData;

  static async create(config: WorkerConfig): Promise<Worker> {
    const { numWorkers, idx, syncArrBuffer, wasmMemory, wasmInData } = config;

    const worker = new Worker();

    worker._numWorkers = numWorkers;
    worker._workerIdx = idx;
    worker._wasmInData = wasmInData;
    worker._wasmMemory = wasmMemory;
    worker._syncArr = new Int32Array(syncArrBuffer);
    worker._sleepArr = new Int32Array(new SharedArrayBuffer(4));
    worker._rowRange = getRange(
      worker._workerIdx,
      worker._wasmInData.frameHeight,
      worker._numWorkers,
    );
    worker._wasmData = await wasm.initWasm(wasmInData);
    // worker._frameBuffer = this._wasmData.ui8cFramebuffer;

    return worker;
  }

  // constructor() {}

  waitThreadsInit(): void {
    postMessage(`ready`);
    const result = Atomics.wait(this._syncArr, this._numWorkers, 0);
    console.log(`Worker ${self.name} awoken with ${result}`); // TODO
  }

  run(): void {
    const idx = this._workerIdx;

    this.waitThreadsInit();

    for (;;) {
      Atomics.wait(this._syncArr, idx, 0);
      // sleep(this._sleepArr, 10); // TODO
      // clearBackgroundWasm(this._wasmData, this._rowRange);
      // ...
      Atomics.store(this._syncArr, idx, 0);
      Atomics.notify(this._syncArr, idx);
    }
  }
}

let worker: Worker;

const commands = {
  async run(config: WorkerConfig): Promise<void> {
    worker = await Worker.create(config);
    worker.run();
  },
};

// ENTRY POINT
self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

export { WorkerConfig };
