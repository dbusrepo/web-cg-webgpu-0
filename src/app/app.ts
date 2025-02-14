// import assert from 'assert';
import type { AppWorkerParams } from './appWorker';
import type { KeyEvent, EventLog } from './appTypes';
import type {
  KeyCode,
  KeyInputEvent,
  // CanvasDisplayResizeEvent,
} from './events';
import {
  StartViewMode,
  type EnginePanelConfig,
  mainConfig,
} from '../config/mainConfig';
import { requestPointerLock } from './pointerlock';
import { statsConfig } from '../ui/stats/statsConfig';
import { AppWorkerCommandEnum } from './appWorker';
import type { WorkerStatsUpdate } from '../ui/stats/stats';
import { Stats, FrameStatsEnum } from '../ui/stats/stats';
import { StatsPanel } from '../ui/stats/statsPanel';
import { type Panel } from '../panels/panel';
import { EnginePanel } from '../panels/enginePanel';
// import { ViewPanel } from '../panels/viewPanel';
import { AppCommandEnum, PanelIdEnum, KeyEventsEnum } from './appTypes';

class App {
  private stats: Stats;
  private enginePanel: EnginePanel;
  private appWorker: Worker;

  async init(): Promise<void> {
    this.stats = this.initStatsPanel();
    this.initPanels();
    this.initEventListeners();
    await this.initAppWorker();
    this.initObservers();
    this.enginePanel.showInit();
  }

  private initEventListeners(): void {
    this.initKeyListeners(this.enginePanel);
    this.initPointerLock(this.enginePanel);
  }

  private initKeyListeners(panel: Panel): void {
    const keyEventCmd = {
      [KeyEventsEnum.KEY_DOWN]: AppWorkerCommandEnum.KEY_DOWN,
      [KeyEventsEnum.KEY_UP]: AppWorkerCommandEnum.KEY_UP,
    };

    const addKeyListener = (keyEvent: KeyEvent): void =>
      panel.InputElement.addEventListener(keyEvent, (event) => {
        if (
          panel.InputKeys.has(event.code) &&
          !panel.ignoreInputKey(event.code)
        ) {
          const keyInputEvent: KeyInputEvent = {
            code: event.code as KeyCode,
            panelId: panel.Id,
          };
          this.appWorker.postMessage({
            command: keyEventCmd[keyEvent],
            params: keyInputEvent,
          });
        }
      });

    for (const event of Object.values(KeyEventsEnum) as KeyEventsEnum[]) {
      addKeyListener(event);
    }
  }

  private initPointerLock(enginePanel: EnginePanel): void {
    const canvasEl = this.enginePanel.Canvas;

    const handleClick = (event: MouseEvent): void => {
      if (event.target !== canvasEl) {
        return;
      }
      const canRequestPointerLock = !(
        document.pointerLockElement || enginePanel.isConsoleOpen
      );
      if (canRequestPointerLock) {
        canvasEl.removeEventListener('click', handleClick);
        const addEventListener = (): void =>
          canvasEl.addEventListener('click', handleClick);
        async function requestPointerLockAsync(): Promise<void> {
          try {
            await requestPointerLock(canvasEl);
            addEventListener();
          } catch (error) {
            console.error('pointer lock error');
            console.error(error);
          }
        }
        requestPointerLockAsync();
      }
    };

    canvasEl.addEventListener('click', handleClick);

    const mouseMoveHandler = (event: MouseEvent): void => {
      this.appWorker.postMessage({
        command: AppWorkerCommandEnum.MOUSE_MOVE,
        params: {
          dx: event.movementX,
          dy: event.movementY,
        },
      });
    };

    const pointerLockChangeHandler = (): void => {
      if (document.pointerLockElement === canvasEl) {
        // console.log('pointer lock acquired');
        // this.appWorker.postMessage({
        //   command: AppWorkerCommandEnum.POINTER_LOCK_CHANGE,
        //   params: {
        //     isLocked: true,
        //   },
        // });
        canvasEl.addEventListener('mousemove', mouseMoveHandler, false);
      } else {
        // console.log('pointer lock lost');
        // this.appWorker.postMessage({
        //   command: AppWorkerCommandEnum.POINTER_LOCK_CHANGE,
        //   params: {
        //     isLocked: false,
        //   },
        // });
        canvasEl.removeEventListener('mousemove', mouseMoveHandler, false);
      }
    };

    const pointerLockErrorHandler = (): void => {
      // console.error('Pointer lock error');
    };

    document.addEventListener('pointerlockchange', pointerLockChangeHandler);
    document.addEventListener('pointerlockerror', pointerLockErrorHandler);
  }

  private onResize(entry: ResizeObserverEntry): [number, number] {
    let width;
    let height;
    let dpr = window.devicePixelRatio;
    // let dprSupport = false;
    if (entry.devicePixelContentBoxSize?.[0]) {
      // NOTE: Only this path gives the correct answer
      // The other paths are an imperfect fallback
      // for browsers that don't provide anyway to do this
      width = entry.devicePixelContentBoxSize[0].inlineSize;
      height = entry.devicePixelContentBoxSize[0].blockSize;
      dpr = 1; // it's already in width and height
      // dprSupport = true;
    } else if (entry.contentBoxSize?.[0]) {
      width = entry.contentBoxSize[0].inlineSize;
      height = entry.contentBoxSize[0].blockSize;
    } else {
      // legacy
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    }
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);
    return [displayWidth, displayHeight];
  }

  private initObservers(): void {
    const onResize = (entries: ResizeObserverEntry[]): void => {
      for (const entry of entries) {
        if (entry.target === this.enginePanel.Canvas) {
          const [width, height] = this.onResize(entry);
          this.appWorker.postMessage({
            command: AppWorkerCommandEnum.RESIZE_CANVAS_DISPLAY_SIZE,
            params: {
              width,
              height,
            },
          });
        }
      }
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(this.enginePanel.Canvas, { box: 'content-box' });
  }

  async initAppWorker(): Promise<void> {
    const workerUrl = new URL('appWorker.ts', import.meta.url);
    this.appWorker = new Worker(workerUrl, {
      name: 'appWorker',
      type: 'module',
    });
    const initPromise = this.initAppWorkerMsgHandlers();
    this.sendInitMsgToAppWorker();
    await initPromise;
  }

  private sendInitMsgToAppWorker(): void {
    const params: AppWorkerParams = {
      engineCanvas: this.enginePanel.Canvas.transferControlToOffscreen(),
    };
    const transferables = [params.engineCanvas];

    this.appWorker.postMessage(
      {
        command: AppWorkerCommandEnum.INIT,
        params,
      },
      transferables,
    );
  }

  private initAppWorkerMsgHandlers(): Promise<void> {
    const { enginePanel } = this;

    let resolveInit: (value: void | PromiseLike<void>) => void;

    const initPromise = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    const commands = {
      [AppCommandEnum.INIT]: (): void => {
        resolveInit();
      },
      [AppCommandEnum.UPDATE_STATS]: (values: WorkerStatsUpdate): void => {
        enginePanel.Stats.update(values);
        enginePanel.MenuGui.updateFpsGraph(values[FrameStatsEnum.UFPS]);
      },
      [AppCommandEnum.EVENT]: (eventObj: EventLog): void => {
        enginePanel.EventLog?.log(`event ${eventObj.event}`, eventObj.msg);
      },
    };

    this.appWorker.addEventListener('message', (event) => {
      const { command, params } = event.data;
      const commandKey = command as keyof typeof commands;
      if (Object.prototype.hasOwnProperty.call(commands, commandKey)) {
        try {
          commands[commandKey](params);
        } catch (error) {
          console.error('error executing command in appWorker message handler');
          console.error(error);
        }
      }
    });

    return initPromise;
  }

  run(): void {
    this.appWorker.postMessage({
      command: AppWorkerCommandEnum.RUN,
    });
  }

  private initStatsPanel(): Stats {
    const stats = new Stats();
    const cfg = {
      ...statsConfig,
      isVisible: true,
      // enable: false,
      // isVisible: false,
    };
    stats.init(cfg);
    const fpsPanel = new StatsPanel({
      id: FrameStatsEnum.FPS,
      title: 'FPS',
      fg: '#0ff',
      bg: '#022',
      graphHeight: 200,
    });
    // const rpsPanel = new StatsPanel({
    //   title: StatsNameEnum.RPS,
    //   fg: '#f80',
    //   bg: '#022',
    //   graphHeight: 200,
    // });
    const upsPanel = new StatsPanel({
      id: FrameStatsEnum.UPS,
      title: 'UPS',
      // yellow
      fg: '#ff0',
      bg: '#220',
      graphHeight: 200,
    });
    const ufpsPanel = new StatsPanel({
      id: FrameStatsEnum.UFPS,
      title: 'UFPS',
      fg: '#f50',
      bg: '#110',
      graphHeight: 1000,
    });
    const frameTimeMsPanel = new StatsPanel({
      id: FrameStatsEnum.FRAME_TIME_MS,
      title: 'MS',
      fg: '#0f0',
      bg: '#020',
      graphHeight: 100,
    });
    // const unlockedFpsPanel = new StatsPanel(StatsNames.FPSU, '#f50', '#110');
    // const wasmHeapMem = new StatsPanel(StatsNames.WASM_HEAP, '#0b0', '#030');
    // this.mem_panel = new StatsPanel('MEM', '#ff0', '#330');
    stats.addPanel(fpsPanel);
    // stats.addPanel(rpsPanel);
    stats.addPanel(upsPanel);
    stats.addPanel(ufpsPanel);
    stats.addPanel(frameTimeMsPanel);
    // this._stats.addPanel(wasmHeapMem);
    // add mem stats panel
    // const memPanel = new MemoryStats(this._stats);
    return stats;
  }

  private initPanels(): void {
    const board = document.querySelector('#board') as HTMLDivElement;

    const row0 = document.createElement('div');
    row0.classList.add('row', 'row0');
    board.append(row0);

    // const row1 = document.createElement('div');
    // row1.classList.add('row', 'row1');
    // board.appendChild(row1);

    // board.style.display = 'none';

    this.enginePanel = this.buildEnginePanel(board, row0);
  }

  private buildEnginePanel(
    board: HTMLDivElement,
    parentNode: HTMLDivElement,
  ): EnginePanel {
    const { enginePanelConfig } = mainConfig;
    // parentNode.style.zIndex = '1'; // TODO:

    const panelConfig: EnginePanelConfig = {
      ...enginePanelConfig,
      // startViewMode: StartViewMode.FULL_WIN,
      startViewMode: StartViewMode.WIN,
      title: 'Engine view',
      id: PanelIdEnum.ENGINE,
      focusOnStart: true,
      eventLogConfig: {
        ...enginePanelConfig.eventLogConfig,
        isVisible: true,
        isBelowCanvas: true,
      },
    };

    const enginePanel = new EnginePanel(board, parentNode);
    enginePanel.init(panelConfig, this.stats);
    return enginePanel;
  }

  // private buildViewPanel(
  //   board: HTMLDivElement,
  //   parentNode: HTMLDivElement,
  // ): ViewPanel {
  //   const { viewPanelConfig } = mainConfig;
  //   const panelConfig: ViewPanelConfig = {
  //     ...viewPanelConfig,
  //     startViewMode: StartViewMode.WIN,
  //     title: 'View',
  //     id: 1,
  //     // focusOnStart: true,
  //   };
  //   const viewPanel = new ViewPanel(board, parentNode);
  //   viewPanel.init(panelConfig, this.stats);
  //   return viewPanel;
  // }
}

export { App };
