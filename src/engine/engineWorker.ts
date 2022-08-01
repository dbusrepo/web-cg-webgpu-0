import { MemoryRegion, MemoryRegionsData } from './memoryRegions';
import { WasmModules, WasmInput, loadWasmModules } from './initWasm';
import { range } from './utils';
import { clearBg } from './draw';
import { Range } from '../common';

type EngineWorkerConfig = {
  workerIdx: number;
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
  protected _frameHeightRange: Range;

  public async init(config: EngineWorkerConfig): Promise<void> {
    this._config = config;

    const { memory } = config;

    this._memi8 = new Uint8Array(memory.buffer, 0, config.memInitialSize);
    this._memi32 = new Uint32Array(memory.buffer, 0, config.memInitialSize / 4);

    this._frameBuffer = new Uint8ClampedArray(
      memory.buffer,
      config.memOffsets[MemoryRegion.FRAMEBUFFER],
      config.memSizes[MemoryRegion.FRAMEBUFFER],
    );

    this._syncArr = new Int32Array(memory.buffer, 
      config.memOffsets[MemoryRegion.SYNC_ARRAY],
      config.memSizes[MemoryRegion.SYNC_ARRAY],
    );

    this.syncStore(this._config.workerIdx, 0);

    this._sleepArr = new Int32Array(memory.buffer, 
      config.memOffsets[MemoryRegion.SLEEP_ARRAY],
      config.memSizes[MemoryRegion.SLEEP_ARRAY],
    );

    await this.initWasmModules();
    // this._frameBuffer = this._wasmData.ui8cFramebuffer;

    this._frameHeightRange = range(
      config.workerIdx,
      config.numWorkers,
      config.frameHeight,
    );
  }

  private async initWasmModules(): Promise<void> {
    const initData: WasmInput = {
      memory: this._config.memory,
      frameWidth: this._config.frameWidth,
      frameHeight: this._config.frameHeight,
      frameBufferOffset: this._config.memOffsets[MemoryRegion.FRAMEBUFFER],
      frameBufferSize: this._config.memSizes[MemoryRegion.FRAMEBUFFER],
    };

    this._wasmInitInput = initData;
    this._wasmModules = await loadWasmModules(initData);
  }

  protected syncStore(idx: number, value: number): void {
    Atomics.store(this._syncArr, idx, value);
  }

  protected syncWait(idx: number, value: number): void {
    Atomics.wait(this._syncArr, idx, value);
  }

  protected syncNotify(idx: number): void {
    Atomics.notify(this._syncArr, idx);
  }

  run(): void {
    console.log(`Worker ${this._config.workerIdx} running!`);
    const idx = this._config.workerIdx;
    const r = ( Math.random() * 255 ) | 0;
    const g = ( Math.random() * 255 ) | 0;
    const b = (Math.random() * 255 ) | 0;
    // console.log(b);
    // ABGR
    const color = 0xff_00_00_00 | r | (g << 8) | (b << 16);
    for (;;) {
      this.syncWait(idx, 0);
      // sleep(this._sleepArr, 10); // TODO
      clearBg(this._wasmModules, color, this._frameHeightRange);
      this.syncStore(idx, 0);
      this.syncNotify(idx);
    }
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
  }
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
