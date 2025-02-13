// import assert from 'assert';
import { type WasmMemRegionsData, MemRegionsEnum } from './wasmMemUtils';
import type { WasmViews } from './wasmViews';
import type { WasmModules, WasmImports } from './wasmLoader';
import { loadWasmModules } from './wasmLoader';

interface WasmRunParams {
  // usePalette: boolean;
  wasmMem: WebAssembly.Memory;
  wasmMemRegionsSizes: WasmMemRegionsData;
  wasmMemRegionsOffsets: WasmMemRegionsData;
  wasmWorkerHeapSize: number;
  mainWorkerIdx: number;
  workerIdx: number;
  numWorkers: number;
}

// eslint-disable-next-line import/no-mutable-exports
let gWasmRun: WasmRun;
// eslint-disable-next-line import/no-mutable-exports
let gWasmView: DataView;
// eslint-disable-next-line import/no-mutable-exports
let gWasmViews: WasmViews;

class WasmRun {
  protected params: WasmRunParams;
  protected wasmModules: WasmModules;
  protected wasmViews: WasmViews;

  public async init(
    params: WasmRunParams,
    wasmViews: WasmViews,
  ): Promise<void> {
    this.params = params;
    this.wasmViews = wasmViews;
    await this.loadWasmModules();
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
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
      mainWorkerIdx,
      numWorkers,
      workerIdx,
    } = this.params;

    const logf = (f: number): void =>
      console.log(`[wasm] Worker [${workerIdx}]: ${f}`);

    const logi = (i: number): void => {
      console.log(`[wasm] Worker [${workerIdx}]: ${i}`);
    };

    const wasmImports: WasmImports = {
      memory,
      syncArrayPtr: memOffsets[MemRegionsEnum.SYNC_ARRAY],
      sleepArrayPtr: memOffsets[MemRegionsEnum.SLEEP_ARRAY],
      mainWorkerIdx,
      workerIdx,
      numWorkers,
      workersHeapPtr: memOffsets[MemRegionsEnum.WORKERS_HEAPS],
      workerHeapSize,
      sharedHeapPtr: memOffsets[MemRegionsEnum.HEAP],
      workersMemCountersPtr: memOffsets[MemRegionsEnum.MEM_COUNTERS],
      workersMemCountersSize: memSizes[MemRegionsEnum.MEM_COUNTERS],
      hrTimerPtr: memOffsets[MemRegionsEnum.HR_TIMER],
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
