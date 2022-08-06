import {
  MemoryRegion,
  MemoryRegionsData,
  WORKER_HEAP_SIZE,
} from './memoryRegions';
import { WasmModules, WasmInput, loadWasmModules } from './initWasm';
import { syncStore, syncWait, syncNotify, sleep } from './utils';

type EngineWorkerConfig = {
  workerIdx: number; // >= 1
  numWorkers: number;
  frameWidth: number;
  frameHeight: number;
  memInitialSize: number;
  memOffsets: MemoryRegionsData;
  memSizes: MemoryRegionsData;
  memory: WebAssembly.Memory;
};

class EngineWorker {
  protected _config: EngineWorkerConfig;
  protected _wasmInitInput: WasmInput;
  protected _wasmModules: WasmModules;
  protected _memi8: Uint8Array;
  protected _memi32: Uint32Array;
  protected _frameBuffer: Uint8ClampedArray;
  protected _syncArr: Int32Array;
  protected _sleepArr: Int32Array;

  public async init(config: EngineWorkerConfig): Promise<void> {
    this._config = config;

    const { memory, workerIdx } = config;

    this._memi8 = new Uint8Array(memory.buffer, 0, config.memInitialSize);
    this._memi32 = new Uint32Array(memory.buffer, 0, config.memInitialSize / 4);

    this._frameBuffer = new Uint8ClampedArray(
      memory.buffer,
      config.memOffsets[MemoryRegion.FRAMEBUFFER],
      config.memSizes[MemoryRegion.FRAMEBUFFER],
    );

    this._syncArr = new Int32Array(
      memory.buffer,
      config.memOffsets[MemoryRegion.SYNC_ARRAY],
      config.memSizes[MemoryRegion.SYNC_ARRAY],
    );

    syncStore(this._syncArr, workerIdx, 0);

    this._sleepArr = new Int32Array(
      memory.buffer,
      config.memOffsets[MemoryRegion.SLEEP_ARRAY],
      config.memSizes[MemoryRegion.SLEEP_ARRAY],
    );

    syncStore(this._sleepArr, workerIdx, 0);

    await this.initWasmModules();
    // this._frameBuffer = this._wasmData.ui8cFramebuffer;
  }

  private randColor(): number {
    const r = (Math.random() * 255) | 0;
    const g = (Math.random() * 255) | 0;
    const b = (Math.random() * 255) | 0;
    const color = 0xff_00_00_00 | r | (g << 8) | (b << 16);
    return color;
  }

  private async initWasmModules(): Promise<void> {
    const initData: WasmInput = {
      memory: this._config.memory,
      frameWidth: this._config.frameWidth,
      frameHeight: this._config.frameHeight,
      frameBufferOffset: this._config.memOffsets[MemoryRegion.FRAMEBUFFER],
      syncArrayOffset: this._config.memOffsets[MemoryRegion.SYNC_ARRAY],
      sleepArrayOffset: this._config.memOffsets[MemoryRegion.SLEEP_ARRAY],
      workersHeapOffset: this._config.memOffsets[MemoryRegion.WORKERS_HEAP],
      heapOffset: this._config.memOffsets[MemoryRegion.HEAP],
      workerHeapSize: WORKER_HEAP_SIZE,
      workerIdx: this._config.workerIdx,
      numWorkers: this._config.numWorkers,
      bgColor: this.randColor(),
      logf: (f: number) =>
        console.log(`Worker [${this._config.workerIdx}]: ${f}`),
      logi: (i: number) =>
        console.log(`Worker [${this._config.workerIdx}]: ${i}`),
    };

    this._wasmInitInput = initData;
    this._wasmModules = await loadWasmModules(initData);
    // console.log('HERE: ' + this._wasmModules.engineWorker.newVec(12));
    // console.log('HERE: ' + this._wasmModules.engineWorker.newVec(16));
  }

  run(): void {
    console.log(`Worker ${this._config.workerIdx} running!`);
    try {
      this._wasmModules.engineWorker.run();
    } catch (e) {
      console.log(e);
    }
    // const idx = this._config.workerIdx;
    // const r = ( Math.random() * 255 ) | 0;
    // const g = ( Math.random() * 255 ) | 0;
    // const b = (Math.random() * 255 ) | 0;
    // const color = 0xff_00_00_00 | r | (g << 8) | (b << 16);
    // // ABGR
    // for (;;) {
    //   syncWait(this._syncArr, idx, 0);
    //   // sleep(this._syncArr, idx, 1000);
    //   clearBg(this._wasmModules, color, this._frameHeightRange);
    //   syncStore(this._syncArr, idx, 0);
    //   syncNotify(this._syncArr, idx);
    // }
  }
}

let engineWorker: EngineWorker;

const commands = {
  async init(config: EngineWorkerConfig): Promise<void> {
    engineWorker = new EngineWorker();
    await engineWorker.init(config);
    postMessage('ready');
  },
  run(): void {
    engineWorker.run();
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

export { EngineWorker, EngineWorkerConfig };
