// import assert from 'assert';
import * as WasmUtils from './wasmMemUtils';
import type { WasmViews } from './wasmViews';
// import { buildWasmMemViews } from './wasmViews';
import type { WasmModules, WasmImports } from './wasmLoader';
import { loadWasmModules } from './wasmLoader';

type WasmRunParams = {
  // usePalette: boolean;
  wasmMem: WebAssembly.Memory;
  wasmMemRegionsSizes: WasmUtils.WasmMemRegionsData;
  wasmMemRegionsOffsets: WasmUtils.WasmMemRegionsData;
  wasmWorkerHeapSize: number;
  mainWorkerIdx: number;
  workerIdx: number;
  numWorkers: number;
};

let gWasmRun: WasmRun;
let gWasmView: DataView;
let gWasmViews: WasmViews;

class WasmRun {
  protected params: WasmRunParams;
  protected wasmModules: WasmModules;
  protected wasmViews: WasmViews;

  public async init(params: WasmRunParams, wasmViews: WasmViews) {
    this.params = params;
    this.wasmViews = wasmViews;
    await this.loadWasmModules();
    gWasmRun = this;
    gWasmView = this.wasmViews.view;
    gWasmViews = this.wasmViews;
  }

  private buildWasmImports(): WasmImports {
    const {
      wasmMem: memory,
      wasmMemRegionsSizes: memSizes,
      wasmMemRegionsOffsets: memOffsets,
      wasmWorkerHeapSize: workerHeapSize,
      // surface1sizes,
      mainWorkerIdx,
      numWorkers,
      workerIdx,
    } = this.params;

    const logf = (f: number) =>
      console.log(`[wasm] Worker [${workerIdx}]: ${f}`);

    const logi = (i: number) => {
      console.log(`[wasm] Worker [${workerIdx}]: ${i}`);
    };

    const wasmImports: WasmImports = {
      memory,

      syncArrayPtr: memOffsets[WasmUtils.MemRegionsEnum.SYNC_ARRAY],
      sleepArrayPtr: memOffsets[WasmUtils.MemRegionsEnum.SLEEP_ARRAY],
      mainWorkerIdx,
      workerIdx,
      numWorkers,
      workersHeapPtr: memOffsets[WasmUtils.MemRegionsEnum.WORKERS_HEAPS],
      workerHeapSize,
      sharedHeapPtr: memOffsets[WasmUtils.MemRegionsEnum.HEAP],
      // usePalette: this._config.usePalette ? 1 : 0,
      // usePalette: 0,
      workersMemCountersPtr: memOffsets[WasmUtils.MemRegionsEnum.MEM_COUNTERS],
      workersMemCountersSize: memSizes[WasmUtils.MemRegionsEnum.MEM_COUNTERS],
      hrTimerPtr: memOffsets[WasmUtils.MemRegionsEnum.HR_TIMER],

      logi,
      logf,
    };

    return wasmImports;
  }

  private async loadWasmModules(): Promise<void> {
    const wasmImports = this.buildWasmImports();
    this.wasmModules = await loadWasmModules(wasmImports);
  }

  get WasmViews(): WasmViews {
    return this.wasmViews;
  }

  get WasmModules(): WasmModules {
    return this.wasmModules;
  }

  get WasmMem(): WebAssembly.Memory {
    return this.params.wasmMem;
  }
}

export type { WasmRunParams };
export { WasmRun, gWasmRun, gWasmView, gWasmViews };
