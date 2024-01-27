// import assert from 'assert';
import type { AppWorkerParams } from './appWorker';
import type { KeyEvent, PanelId, EventLog } from './appTypes';
import type {
  KeyCode,
  KeyInputEvent,
  MouseMoveEvent,
  // CanvasDisplayResizeEvent,
} from './events';
import {
  StartViewMode,
  EnginePanelConfig,
  ViewPanelConfig,
  mainConfig,
} from '../config/mainConfig';
import { requestPointerLock } from './pointerlock';
import { statsConfig } from '../ui/stats/statsConfig';
import { AppWorkerCommandEnum } from './appWorker';
import { Stats, StatsEnum, StatsValues } from '../ui/stats/stats';
import { StatsPanel } from '../ui/stats/statsPanel';
import { Panel } from '../panels/panel';
import { EnginePanel } from '../panels/enginePanel';
// import { ViewPanel } from '../panels/viewPanel';
import { AppCommandEnum, PanelIdEnum, KeyEventsEnum } from './appTypes';

class App {
  private stats: Stats;
  private enginePanel: EnginePanel;
  private appWorker: Worker;

  async init() {
    this.stats = this.initStatsPanel();
    this.initPanels();
    this.initEventListeners();
    await this.initAppWorker();
    this.initObservers();
    this.enginePanel.showInit();
  }

  private initEventListeners() {
    this.initKeyListeners(this.enginePanel);
    this.initPointerLock(this.enginePanel);
  }

  private initKeyListeners(panel: Panel) {
    const keyEventCmd = {
      [KeyEventsEnum.KEY_DOWN]: AppWorkerCommandEnum.KEY_DOWN,
      [KeyEventsEnum.KEY_UP]: AppWorkerCommandEnum.KEY_UP,
    };

    const addKeyListener = (keyEvent: KeyEvent) =>
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

    (Object.values(KeyEventsEnum) as KeyEventsEnum[]).forEach(addKeyListener);
  }

  private initPointerLock(enginePanel: EnginePanel) {
    const canvasEl = this.enginePanel.Canvas;

    const handleClick = async (event: MouseEvent) => {
      if (event.target !== canvasEl) {
        return;
      }
      const canRequestPointerLock = !(
        document.pointerLockElement || this.enginePanel.isConsoleOpen
      );
      if (canRequestPointerLock) {
        canvasEl.removeEventListener('click', handleClick);
        await requestPointerLock(canvasEl);
        canvasEl.addEventListener('click', handleClick);
      }
    };

    canvasEl.addEventListener('click', handleClick);

    const mouseMoveHandler = (event: MouseEvent) => {
      this.appWorker.postMessage({
        command: AppWorkerCommandEnum.MOUSE_MOVE,
        params: {
          dx: event.movementX,
          dy: event.movementY,
        },
      });
    };

    const pointerLockChangeHandler = () => {
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

    const pointerLockErrorHandler = () => {
      // console.error('Pointer lock error');
    };

    document.addEventListener('pointerlockchange', pointerLockChangeHandler);
    document.addEventListener('pointerlockerror', pointerLockErrorHandler);
  }

  private buildAppWorkerParams() {
    const params: AppWorkerParams = {
      engineCanvas: this.enginePanel.Canvas.transferControlToOffscreen(),
    };

    return {
      params,
      transferables: [params.engineCanvas],
    };
  }

  private onResize(entry: ResizeObserverEntry): [number, number] {
    let width;
    let height;
    let dpr = window.devicePixelRatio;
    let dprSupport = false;
    if (entry.devicePixelContentBoxSize) {
      // NOTE: Only this path gives the correct answer
      // The other paths are an imperfect fallback
      // for browsers that don't provide anyway to do this
      width = entry.devicePixelContentBoxSize[0].inlineSize;
      height = entry.devicePixelContentBoxSize[0].blockSize;
      dpr = 1; // it's already in width and height
      dprSupport = true;
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

  private initObservers() {
    const onResize = (entries: ResizeObserverEntry[]) => {
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

  async initAppWorker() {
    this.appWorker = new Worker(new URL('./appWorker.ts', import.meta.url));
    const initPromise = this.initAppWorkerMsgHandlers();
    this.sendInitMsgToAppWorker();
    await initPromise;
  }

  private sendInitMsgToAppWorker() {
    const { params, transferables } = this.buildAppWorkerParams();

    this.appWorker.postMessage(
      {
        command: AppWorkerCommandEnum.INIT,
        params,
      },
      transferables,
    );
  }

  private initAppWorkerMsgHandlers() {
    let { enginePanel } = this;

    let resolveInit: (value: void | PromiseLike<void>) => void;

    const initPromise = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    const commands = {
      [AppCommandEnum.INIT]: () => {
        resolveInit();
      },
      [AppCommandEnum.UPDATE_STATS]: (values: StatsValues) => {
        enginePanel.Stats.update(values);
        enginePanel.MenuGui.updateFps(values[StatsEnum.UFPS] || 0);
      },
      [AppCommandEnum.EVENT]: (eventObj: EventLog) => {
        enginePanel.EventLog?.log(`event ${eventObj.event}`, eventObj.msg);
      },
    };

    this.appWorker.onmessage = ({ data: { command, params } }) => {
      if (commands.hasOwnProperty(command)) {
        try {
          commands[command as keyof typeof commands]!(params);
        } catch (ex) {
          console.error('error in engine panel message handler');
          console.error(ex);
        }
      }
    };

    return initPromise;
  }

  run() {
    this.appWorker.postMessage({
      command: AppWorkerCommandEnum.RUN,
    });
  }

  private initStatsPanel() {
    const stats = new Stats();
    const cfg = {
      ...statsConfig,
      isVisible: true,
      // enable: false,
      // isVisible: false,
    };
    stats.init(cfg);
    const fpsPanel = new StatsPanel({
      id: StatsEnum.FPS,
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
      id: StatsEnum.UPS,
      title: 'UPS',
      // yellow
      fg: '#ff0',
      bg: '#220',
      graphHeight: 200,
    });
    const ufpsPanel = new StatsPanel({
      id: StatsEnum.UFPS,
      title: 'UFPS',
      fg: '#f50',
      bg: '#110',
      graphHeight: 1000,
    });
    const frameTimeMsPanel = new StatsPanel({
      id: StatsEnum.FRAME_TIME_MS,
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

  private initPanels() {
    const board = <HTMLDivElement>document.querySelector('#board');

    const row0 = document.createElement('div');
    row0.classList.add('row', 'row0');
    board.appendChild(row0);

    // const row1 = document.createElement('div');
    // row1.classList.add('row', 'row1');
    // board.appendChild(row1);

    // board.style.display = 'none';

    this.enginePanel = this.buildEnginePanel(board, row0);
  }

  private buildEnginePanel(board: HTMLDivElement, parentNode: HTMLDivElement) {
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
