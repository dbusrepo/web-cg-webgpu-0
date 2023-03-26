// import assert from 'assert';
// import { fileTypeFromBuffer } from 'file-type';
import * as WasmUtils from './wasmMemUtils';
import { WasmModules, WasmInput, loadWasmModules } from './wasmInit';
// import { syncStore, randColor, sleep } from './utils';
// import { BitImageRGBA } from './assets/images/bitImageRGBA';
// import { PngDecoderRGBA } from './assets/images/vivaxy-png/PngDecoderRGBA';
import { FONT_X_SIZE, FONT_Y_SIZE, FONT_SPACING } from '../assets/fonts/font';
import { syncStore } from './utils';
import { WasmConfig } from './wasmConfig';

import Commands from './engineWorkerCommands';

type WasmExecConfig = {
  workerIdx: number;
  numWorkers: number;
  frameWidth: number;
  frameHeight: number;
  // usePalette: boolean;
};

type WasmViews = WasmUtils.views.WasmViews;

class WasmExecutor {
  protected _cfg: WasmExecConfig;
  protected _wasmCfg: WasmConfig;
  protected _wasmViews: WasmViews;
  protected _wasmModules: WasmModules;

  public async init(
    workerCfg: WasmExecConfig,
    wasmCfg: WasmConfig,
  ): Promise<void> {
    this._cfg = workerCfg;
    await this._initWasm(wasmCfg);
  }

  private async _initWasm(config: WasmConfig): Promise<void> {
    this._wasmCfg = config;
    this._initWasmMemViews();
    await this.initWasmModules();
  }

  protected _initWasmMemViews(): void {
    const {
      wasmMem: mem,
      wasmMemRegionsOffsets: memOffsets,
      wasmMemRegionsSizes: memSizes,
    } = this._wasmCfg;

    const { workerIdx } = this._cfg;

    this._wasmViews = WasmUtils.views.buildWasmMemViews(
      mem,
      memOffsets,
      memSizes,
    );
    syncStore(this._wasmViews.syncArr, workerIdx, 0);
    syncStore(this._wasmViews.sleepArr, workerIdx, 0);
  }

  private async initWasmModules(): Promise<void> {
    const {
      wasmMem: memory,
      wasmMemRegionsSizes: memSizes,
      wasmMemRegionsOffsets: memOffsets,
      wasmWorkerHeapSize: workerHeapSize,
    } = this._wasmCfg;

    const { frameWidth, frameHeight, numWorkers, workerIdx } = this._cfg;

    const logf = (f: number) =>
      console.log(`[wasm] Worker [${workerIdx}]: ${f}`);
    const logi = (i: number) => {
      // console.trace();
      console.log(`[wasm] Worker [${workerIdx}]: ${i}`);
    };

    const wasmImports: WasmInput = {
      memory,
      frameWidth,
      frameHeight,
      frameBufferPtr: memOffsets[WasmUtils.MemRegions.FRAMEBUFFER_RGBA],
      syncArrayPtr: memOffsets[WasmUtils.MemRegions.SYNC_ARRAY],
      sleepArrayPtr: memOffsets[WasmUtils.MemRegions.SLEEP_ARRAY],
      workerIdx,
      numWorkers,
      workersHeapPtr: memOffsets[WasmUtils.MemRegions.WORKERS_HEAPS],
      workerHeapSize,
      heapPtr: memOffsets[WasmUtils.MemRegions.HEAP],
      bgColor: 0xff_00_00_00, // randColor(),
      // usePalette: this._config.usePalette ? 1 : 0,
      usePalette: 0,
      fontCharsPtr: memOffsets[WasmUtils.MemRegions.FONT_CHARS],
      fontCharsSize: memSizes[WasmUtils.MemRegions.FONT_CHARS],
      numImages: this._wasmCfg.wasmNumImages,
      imagesIndexSize: memSizes[WasmUtils.MemRegions.IMAGES_INDEX],
      imagesIndexPtr: memOffsets[WasmUtils.MemRegions.IMAGES_INDEX],
      imagesDataPtr: memOffsets[WasmUtils.MemRegions.IMAGES],
      imagesDataSize: memSizes[WasmUtils.MemRegions.IMAGES],
      stringsDataPtr: memOffsets[WasmUtils.MemRegions.STRINGS],
      stringsDataSize: memSizes[WasmUtils.MemRegions.STRINGS],
      workersMemCountersPtr:
        memOffsets[WasmUtils.MemRegions.WORKERS_MEM_COUNTERS],
      workersMemCountersSize:
        memSizes[WasmUtils.MemRegions.WORKERS_MEM_COUNTERS],
      inputKeysPtr: memOffsets[WasmUtils.MemRegions.INPUT_KEYS],
      inputKeysSize: memSizes[WasmUtils.MemRegions.INPUT_KEYS],

      FONT_X_SIZE,
      FONT_Y_SIZE,
      FONT_SPACING,

      logi,
      logf,
    };

    // this._wasmInitInput = wasmInput; // save it ?
    this._wasmModules = await loadWasmModules(wasmImports);
  }

  get wasmViews(): WasmViews {
    return this._wasmViews;
  }

  public drawFrame() {
    this._wasmModules.engineWorker.run();
    // this._wasmModules.engineWorker.run();
  }

  run(): void {
    console.log(`Worker ${this._cfg.workerIdx} running!`);
    try {
      this._wasmModules.engineWorker.run();
    } catch (e) {
      console.log(e);
    }
  }
}

let worker: WasmExecutor;

const commands = {
  [Commands.INIT]: async (config: WasmExecConfig): Promise<void> => {
    worker = new WasmExecutor();
    // const initData = await worker.init(config);
    // postMessage(initData);
  },
  // [Commands.INIT_WASM]: async (config: WorkerWasmMemConfig): Promise<void> => {
  //   assert(worker);
  //   // await worker.loadAssets();
  //   await worker.initWasm(config);
  //   postMessage('ready');
  // },
  run(): void {
    worker.run();
  },
};

self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

export { WasmExecutor, WasmExecConfig };
