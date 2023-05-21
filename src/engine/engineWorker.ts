// import assert from 'assert';
import { WasmRun, WasmRunConfig } from './wasmEngine/wasmRun';

const enum EngineWorkerCommands {
  INIT = 'worker_init',
  INIT_WASM = 'worker_init_wasm',
  RUN = 'worker_run',
  RUN_WASM = 'worker_run_wasm',
}

type EngineWorkerParams = {
  workerIndex: number,
  numWorkers: number,
  syncArray: Int32Array;
  sleepArray: Int32Array;
};

class EngineWorker {
  private params: EngineWorkerParams;

  public async init(params: EngineWorkerParams): Promise<void> {
    this.params = params;
  }

  run(): void {
    const { syncArray, workerIndex } = this.params;
    console.log(`Engine worker ${workerIndex} running!`);
    try {
      while (true) {
        Atomics.wait(syncArray, workerIndex, 0);
        // TODO:
        Atomics.store(syncArray, workerIndex, 0);
        Atomics.notify(syncArray, workerIndex);
      }
    } catch (e) {
      console.log(`Error while running engine worker ${this.params.workerIndex}`);
      console.error(e);
    }
  }

  // private async initWasmRun() {
  //   this.wasmRun = new WasmRun();
  //   await this.wasmRun.init(this.cfg.wasmRunCfg);
  // }

  // run(): void {
  //   console.log(`Worker ${this.cfg.wasmRunCfg.workerIdx} running!`);
  //   try {
  //     this.wasmRun.WasmModules.engine.run();
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }
}

let engineWorker: EngineWorker;

const commands = {
  [EngineWorkerCommands.INIT]: async (config: EngineWorkerParams): Promise<void> => {
    engineWorker = new EngineWorker();
    await engineWorker.init(config);
    postMessage({ status: 'init completed' });
  },
  [EngineWorkerCommands.RUN]: async (): Promise<void> => {
    engineWorker.run();
  },
  [EngineWorkerCommands.INIT_WASM]: async (): Promise<void> => {
    // wasmWorker.run();
  },
  [EngineWorkerCommands.RUN_WASM]: async (): Promise<void> => {
    // wasmWorker.run();
  },
};

self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

export { EngineWorkerParams, EngineWorkerCommands };
