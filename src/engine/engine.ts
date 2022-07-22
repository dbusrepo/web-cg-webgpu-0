// import loader from '@assemblyscript/loader';
import assert from 'assert';
import { defaultConfig } from '../config/config';
import { TypedArray, StatsNames, StatsValues } from './common';
import {
  atomicSleep,
  getRange,
  Range,
  NUM_BYTES_DWORD,
  clearBackgroundWasm,
} from './workerUtils';
import * as loadUtils from '../utils/loadFiles'; // TODO
import * as myWasm from './initWasm';
import { WorkerConfig } from './worker';

// test img loading... TODO
// import myImgUrl from 'images/samplePNGImage.png';


// TODO ?
const FRAME_BUF_IDX = myWasm.MemoryRegionNames
  .FRAMEBUFFER as myWasm.MemRegionNameType;

type EngineConfig = {
  canvas: OffscreenCanvas;
  sendStats: boolean;
};

class Engine {
  private static readonly NUM_HELP_WORKERS = 0;
  // #workers = main engine worker + help workers
  private static readonly TOTAL_WORKERS = 1 + Engine.NUM_HELP_WORKERS;
  private static readonly MILLI_IN_SEC = 1000;

  private static readonly RENDER_PERIOD =
    Engine.MILLI_IN_SEC / defaultConfig.target_fps;
  private static readonly UPDATE_PERIOD =
    (defaultConfig.multiplier * Engine.MILLI_IN_SEC) / defaultConfig.target_ups;
  private static readonly UPDATE_TIME_MAX = Engine.UPDATE_PERIOD * 8;

  private static readonly UPD_TIME_ARR_LENGTH = 4;
  private static readonly FRAME_TIME_ARR_LENGTH = 8;

  private static readonly FPS_ARR_LENGTH = 8;
  private static readonly STATS_PERIOD = Engine.MILLI_IN_SEC;

  // engine worker data
  private _workerIdx: number;
  private _rowRange: Range;

  private _canvas: OffscreenCanvas;
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _pixelCount: number;
  private _imageData: ImageData;

  private _wasmInData: myWasm.WasmInDataType;
  private _wasmMemory: WebAssembly.Memory;
  private _wasmData: myWasm.WasmOutDataType;
  private _frameBuffer: Uint8ClampedArray;

  private _syncArr: Int32Array;
  private _sleepArr: Int32Array;

  private _sendStats: boolean;

  private _workers: Worker[];

  static async create(config: EngineConfig): Promise<Engine> {
    const { canvas, sendStats } = config;

    const engine = new Engine();

    engine._canvas = canvas;
    engine._sendStats = sendStats;

    // sync array locations: [main engine worker, help workers, init sync]
    engine._syncArr = new Int32Array(
      new SharedArrayBuffer((Engine.TOTAL_WORKERS + 1) * 4),
    );

    engine._sleepArr = new Int32Array(new SharedArrayBuffer(NUM_BYTES_DWORD)); // for atomic sleep

    engine._ctx = <OffscreenCanvasRenderingContext2D>(
      canvas.getContext('2d', { alpha: false })
    );

    const frameWidth = canvas.width;
    const frameHeight = canvas.height;
    engine._pixelCount = frameWidth * frameHeight;
    engine._imageData = engine._ctx.createImageData(frameWidth, frameHeight);

    await engine.initWasm();
    await engine.initWorkers();

    engine._workerIdx = 0;
    engine._rowRange = getRange(
      engine._workerIdx,
      engine._wasmInData.frameHeight,
      Engine.TOTAL_WORKERS,
    );

    return engine;
  }

  // constructor() {}

  private async initWasm(): Promise<void> {
    this._wasmMemory = new WebAssembly.Memory({
      initial: 512,
      maximum: 512,
      shared: true,
    });

    const wasmInData: myWasm.WasmInDataType = {
      wasmMemory: this._wasmMemory,
      frameWidth: this._canvas.width,
      frameHeight: this._canvas.height,
    };

    this._wasmInData = wasmInData;

    this._wasmData = await myWasm.initWasm(wasmInData);
    this._frameBuffer = this._wasmData.ui8cFramebuffer;
  }

  private async initWorkers(): Promise<void> {
    this._workers = [];
    this._syncArr.fill(0);

    let count = Engine.NUM_HELP_WORKERS;
    const now = Date.now();

    return new Promise((resolve, reject) => {
      if (Engine.NUM_HELP_WORKERS < 1) {
        resolve();
      }
      for (let i = 1; i <= Engine.NUM_HELP_WORKERS; ++i) {
        const worker = new Worker(new URL('./worker.ts', import.meta.url), {
          name: `worker-${i}`,
          type: 'module',
        });
        worker.onmessage = ({ data: msg }) => {
          console.log(
            `Help worker ready: id=${i}, count=${--count}, time=${
              Date.now() - now
            }ms`,
          );
          if (count === 0) {
            const notifyIdx = Engine.TOTAL_WORKERS; // see _syncArr def
            Atomics.notify(this._syncArr, notifyIdx);
            console.log(`Main worker ready: id=0, time=${Date.now() - now}ms`);
            resolve();
          }
        };
        worker.onerror = (error) => {
          console.log('Worker error: ' + error.message + '\n');
          reject(error);
        };
        const workerConfig: WorkerConfig = {
          idx: i,
          numWorkers: Engine.TOTAL_WORKERS,
          syncArrBuffer: this._syncArr.buffer as SharedArrayBuffer,
          wasmMemory: this._wasmMemory,
          wasmInData: this._wasmInData,
        };
        worker.postMessage({
          command: 'run',
          params: workerConfig,
        });
        this._workers.push(worker);
      }
    });
  }

  public run(): void {
    let initTime: number; // TODO not used for now...
    let renderTimeArr: Float64Array;
    let lastUpdateTime: number;
    // let last_render_t: number;
    let timeAcc: number;
    let elapsedTime: number;
    let frameThen: number;
    let frameCount: number;
    let updateCount: number;
    let updateTimeArr: Float64Array;
    let updateTimeCount: number;
    let lastStatsTime: number;
    let statsTimeAcc: number;
    let fpsArr: Float32Array;
    let upsArr: Float32Array;
    let fpsCount: number;
    let resync: boolean;

    let isRunning: boolean;
    let isPaused: boolean;

    const init = (curTimeMs: number) => {
      initTime = curTimeMs;
      lastUpdateTime = lastStatsTime = curTimeMs;
      renderTimeArr = new Float64Array(Engine.FRAME_TIME_ARR_LENGTH);
      timeAcc = 0;
      elapsedTime = 0;
      updateTimeArr = new Float64Array(Engine.UPD_TIME_ARR_LENGTH);
      updateTimeCount = 0;
      statsTimeAcc = 0;
      fpsArr = new Float32Array(Engine.FPS_ARR_LENGTH);
      upsArr = new Float32Array(Engine.FPS_ARR_LENGTH);
      fpsCount = 0;
      resync = false;
      frameCount = updateCount = 0;
      frameThen = performance.now();
      isRunning = true;
      isPaused = false;
      requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(init);

    const calcAvgArrValue = (values: TypedArray, count: number) => {
      let acc = 0;
      const numIter = Math.min(count, values.length);
      for (let i = 0; i < numIter; i++) {
        acc += values[i];
      }
      return acc / numIter;
    };

    const renderLoop = (curTimeMs: number) => {
      requestAnimationFrame(renderLoop);
      const startRenderTime = performance.now();
      let timeFromLastUpdate = curTimeMs - lastUpdateTime;
      const loopStartTime = (lastUpdateTime = curTimeMs);
      // if (is_paused) return; // TODO
      updateStats(timeFromLastUpdate, loopStartTime);
      // handle timer anomalies
      timeFromLastUpdate = Math.min(timeFromLastUpdate, Engine.UPDATE_TIME_MAX);
      timeFromLastUpdate = Math.max(timeFromLastUpdate, 0);
      updateTimeArr[updateTimeCount++ % updateTimeArr.length] =
        timeFromLastUpdate;
      timeFromLastUpdate = calcAvgArrValue(updateTimeArr, updateTimeCount);
      timeAcc += timeFromLastUpdate;
      // spiral of death protection
      if (timeAcc > Engine.UPDATE_TIME_MAX) {
        resync = true;
      }
      // timer resync if requested
      if (resync) {
        timeAcc = 0; // TODO
        // delta_time = App.UPD_PERIOD;
      }
      update();
      render(startRenderTime);
    };

    const update = () => {
      while (timeAcc >= Engine.UPDATE_PERIOD) {
        // TODO see multiplier in update_period def
        // update state with UPD_PERIOD
        // this.scene.update(STEP, t / MULTIPLIER);
        // gameUpdate(STEP, t / MULTIPLIER);
        timeAcc -= Engine.UPDATE_PERIOD;
        updateCount++;
      }
    };

    const render = (startRenderTime: number) => {
      const frameNow = performance.now();
      const elapsed = frameNow - frameThen;
      if (elapsed >= Engine.RENDER_PERIOD) {
        frameThen = frameNow - (elapsed % Engine.RENDER_PERIOD);
        this.drawFrame();
        const renderTime = performance.now() - startRenderTime;
        renderTimeArr[frameCount % renderTimeArr.length] = renderTime;
        frameCount++;
      }
    };

    const updateStats = (
      timeFromLastUpdate: number,
      loopStartTime: number,
    ): void => {
      statsTimeAcc += timeFromLastUpdate;
      if (statsTimeAcc >= Engine.STATS_PERIOD) {
        statsTimeAcc = 0;
        // const tspent = (tnow - start_time) / App.MILLI_IN_SEC;
        const elapsed = loopStartTime - lastStatsTime;
        lastStatsTime = loopStartTime;
        elapsedTime += elapsed;
        const fps = (frameCount * Engine.MILLI_IN_SEC) / elapsedTime;
        const ups = (updateCount * Engine.MILLI_IN_SEC) / elapsedTime;
        // console.log(`${fps} - ${ups}`);
        const fpsIdx = fpsCount++ % Engine.FPS_ARR_LENGTH;
        fpsArr[fpsIdx] = fps;
        upsArr[fpsIdx] = ups;
        if (this._sendStats) {
          const avgFps = Math.round(calcAvgArrValue(fpsArr, fpsCount));
          const avgUps = Math.round(calcAvgArrValue(upsArr, fpsCount));
          const avgMaxFps = Math.round(
            1000 / calcAvgArrValue(renderTimeArr, frameCount),
          );
          const stats: Partial<StatsValues> = {
              [StatsNames.FPS]: avgFps,
              [StatsNames.UPS]: avgUps,
              [StatsNames.UFPS]: avgMaxFps,
          };
          postMessage({
            command: 'updateStats',
            params: stats,
          });
        }
      }
    };
  }

  private drawFrame(): void {
    // this.clearBckgr();

    // postMessage({
    //   command: 'log',
    //   params: { key: 'start' },
    // });

    for (let i = 1; i <= Engine.NUM_HELP_WORKERS; ++i) {
      Atomics.store(this._syncArr, i, 1);
      Atomics.notify(this._syncArr, i);
    }

    clearBackgroundWasm(this._wasmData, this._rowRange);

    for (let i = 1; i <= Engine.NUM_HELP_WORKERS; ++i) {
      Atomics.wait(this._syncArr, i, 1);
    }

    // postMessage({
    //   command: 'msg',
    //   params: { key: 'end' },
    // });

    this.updateImage();
  }

  private updateImage(): void {
    this._imageData.data.set(this._frameBuffer);
    this._ctx.putImageData(this._imageData, 0, 0);
  }

  // private showStats(): void {
  //   this.draw_text(
  //     `FPS: ${Math.round(this.avg_fps)}\nUPS: ${Math.round(this.avg_ups)}`,
  //   );
  // }

  // async loadImages() { // TODO
  //   await loadImageAsImageData(myImgUrl);
  // }

  // UTILS SECTION

  private get_font_height(): number {
    return this._ctx.measureText('M').width + 1;
  }

  private draw_text(txt: string): void {
    // TODO x,y?
    this._ctx.font = 'bold 16pt monospace';
    const lineHeight = 3 + this.get_font_height();
    this._ctx.fillStyle = '#999'; // gray
    const lines = txt.split('\n');
    for (
      let i = 0, x = 1, y = lineHeight;
      i !== lines.length;
      i += 1, y += lineHeight
    ) {
      this._ctx.fillText(lines[i], x, y);
    }
  }

  // private sleep(tMs: number) { // TODO check
  //   atomicSleep(this._sleepArr, tMs);
  // }

}

let engine: Engine;

const commands = {
  async run(config: EngineConfig): Promise<void> {
    engine = await Engine.create(config);
    engine.run();
  },
};

self.addEventListener('message', async ({ data: { command, params } }) => {
  if (commands.hasOwnProperty(command)) {
    try {
      commands[command as keyof typeof commands](params);
    } catch (err) {}
  }
});

export { EngineConfig, Engine };
