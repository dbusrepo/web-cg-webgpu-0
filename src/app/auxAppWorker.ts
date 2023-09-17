import assert from 'assert';
import type { WasmViews } from '../engine/wasmEngine/wasmViews';
import type {
  WasmModules,
  WasmEngineModule,
} from '../engine/wasmEngine/wasmLoader';
import { buildWasmMemViews } from '../engine/wasmEngine/wasmViews';
import type { WasmRunParams } from '../engine/wasmEngine/wasmRun';
import { WasmRun, gWasmRun } from '../engine/wasmEngine/wasmRun';

const enum AuxAppWorkerCommandEnum {
  INIT = 'aux_app_worker_init',
  RUN = 'aux_app_worker_run',
}

type AuxAppWorkerParams = {
  workerIdx: number;
  numWorkers: number;
  wasmRunParams: WasmRunParams;
};

class AuxAppWorker {
  private params: AuxAppWorkerParams;
  private wasmRun: WasmRun;
  private wasmViews: WasmViews;
  private wasmEngineModule: WasmEngineModule;

  async init(params: AuxAppWorkerParams): Promise<void> {
    const { workerIdx } = params;
    console.log(`Aux app worker ${workerIdx} initializing...`);
    this.params = params;
    await this.initWasmRun();
  }

  private async initWasmRun() {
    const { wasmRunParams } = this.params;
    this.wasmRun = new WasmRun();
    this.wasmViews = buildWasmMemViews(
      wasmRunParams.wasmMem,
      wasmRunParams.wasmMemRegionsOffsets,
      wasmRunParams.wasmMemRegionsSizes,
    );
    await this.wasmRun.init(wasmRunParams, this.wasmViews);
    this.wasmEngineModule = this.wasmRun.WasmModules.engine;
  }

  async run() {
    const { workerIdx } = this.params;
    console.log(`Aux app worker ${workerIdx} running`);
    const { wasmViews } = this;
    try {
      for (;;) {
        Atomics.wait(wasmViews.syncArr, workerIdx, 0);
        // this.wasmEngineModule.render();
        Atomics.store(wasmViews.syncArr, workerIdx, 0);
        Atomics.notify(wasmViews.syncArr, workerIdx);
      }
    } catch (ex) {
      console.log(
        `Error while running aux app worker ${this.params.workerIdx}`,
      );
      console.error(ex);
    }
  }
}

let auxAppWorker: AuxAppWorker;

const commands = {
  [AuxAppWorkerCommandEnum.INIT]: async (params: AuxAppWorkerParams) => {
    auxAppWorker = new AuxAppWorker();
    await auxAppWorker.init(params);
    postMessage({
      status: `Aux app worker ${params.workerIdx} init completed`,
    });
  },
  [AuxAppWorkerCommandEnum.RUN]: async () => {
    await auxAppWorker.run();
  },
};

self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

type AuxAppWorkerDesc = {
  workerIdx: number;
  worker: Worker;
};

export type { AuxAppWorkerParams, AuxAppWorkerDesc };
export { AuxAppWorkerCommandEnum };
