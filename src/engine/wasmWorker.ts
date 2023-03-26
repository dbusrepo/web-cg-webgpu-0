// import assert from 'assert';
import * as WasmUtils from './wasmMemUtils';
import { WasmRun, WasmRunConfig } from './wasmRun';
import { WasmConfig } from './wasmConfig';
import Commands from './wasmWorkerCommands';

type WasmWorkerConfig = {
  wasmRunCfg: WasmRunConfig;
  wasmCfg: WasmConfig;
};

type WasmViews = WasmUtils.views.WasmViews;

class WasmWorker {
  private _cfg: WasmWorkerConfig;
  private _wasmRun: WasmRun;
  private _wasmViews: WasmViews;

  public async init(config: WasmWorkerConfig): Promise<void> {
    this._cfg = config;
    await this._initWasmRun();
  }

  private async _initWasmRun() {
    this._wasmRun = new WasmRun();
    await this._wasmRun.init(this._cfg.wasmRunCfg, this._cfg.wasmCfg);
    this._wasmViews = this._wasmRun.wasmViews;
  }

  run(): void {
    console.log(`Worker ${this._cfg.wasmRunCfg.workerIdx} running!`);
    try {
      this._wasmRun.wasmModules.engine.runWorker();
    } catch (e) {
      console.error(e);
    }
  }
}

let wasmWorker: WasmWorker;

const commands = {
  [Commands.INIT]: async (config: WasmWorkerConfig): Promise<void> => {
    wasmWorker = new WasmWorker();
    await wasmWorker.init(config);
    postMessage({ status: 'init completed' });
  },
  [Commands.RUN]: async (): Promise<void> => {
    wasmWorker.run();
  },
};

self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

export { WasmWorkerConfig };
