// import assert from 'assert';
import {
  StartViewMode,
  EnginePanelConfig,
  ViewPanelConfig,
  mainConfig,
} from '../config/mainConfig';
import { statsConfig } from '../ui/stats/statsConfig';
import type { EngineParams } from '../engine/engine';
import { Stats, StatsNameEnum, StatsValues } from '../ui/stats/stats';
import { StatsPanel } from '../ui/stats/statsPanel';
import { EngineCommandsEnum } from '../engine/engine';
import { Panel } from '../panels/panel';
import { EnginePanel } from '../panels/enginePanel';
import { ViewPanel } from '../panels/viewPanel';
import type { KeyEvent, PanelId } from './appTypes';
import { AppCommandsEnum, AppPanelsIdEnum, KeyEventsEnum } from './appTypes';

class App {
  private stats: Stats;
  private panels: Record<AppPanelsIdEnum, Panel>;
  private engineWorker: Worker;

  async init() {
    this.stats = this.initStatsPanel();
    this.initPanels();
    this.initKeyListeners();
    Object.values(this.panels).forEach((panel) => panel.showInit());
    await this.initEngineWorker();
  }

  private initKeyListeners() {
    (Object.keys(this.panels) as PanelId[]).forEach((panelId) => this.addKeyListener(panelId));
  }

  private addKeyListener(panelId: PanelId) {

    const panel = this.panels[panelId];

    const keyEvent2EngineCmd = {
      [KeyEventsEnum.KEY_DOWN]: EngineCommandsEnum.KEY_DOWN,
      [KeyEventsEnum.KEY_UP]: EngineCommandsEnum.KEY_UP,
    };

    const addKeyListener = (keyEvent: KeyEvent) => (
      panel.InputElement.addEventListener(keyEvent, (event) => {
        if (!panel.InputKeys.has(event.code) || panel.ignoreInputKey(event.code)) {
          return;
        }
        this.engineWorker.postMessage({
          command: keyEvent2EngineCmd[keyEvent],
          params: { 
            code: event.code,
            panelId,
          }
        });
      })
    );
    
    (Object.values(KeyEventsEnum) as KeyEventsEnum[]).forEach(addKeyListener);
  }

  private buildEngineWorkerParams() {

    const getOffscreenCanvas = (panel: Panel) => panel.Canvas.transferControlToOffscreen();

    const surfaces = (Object.entries(this.panels) as [PanelId, Panel][]).reduce(
      (acc, [ panelId, panel ]) => {
      acc[panelId] = getOffscreenCanvas(panel);
      return acc;
    }, {} as Record<PanelId, OffscreenCanvas>);

    const params: EngineParams = {
      surfaces,
    };

    return {
      params,
      transferables: Object.values(surfaces),
    };
  }

  async initEngineWorker() {
    this.engineWorker = new Worker(new URL('../engine/engine.ts', import.meta.url));

    const initPromise = this.initEngineWorkerMessageHandlers();

    const { params, transferables } = this.buildEngineWorkerParams();

    this.engineWorker.postMessage(
      {
        command: EngineCommandsEnum.INIT,
        params,
      },
      transferables,
    );

    await initPromise;
  }

  private initEngineWorkerMessageHandlers() {
    let enginePanel = this.panels[AppPanelsIdEnum.ENGINE] as EnginePanel;
    let viewPanel = this.panels[AppPanelsIdEnum.VIEW] as ViewPanel;

    let resolveInit: (value: void | PromiseLike<void>) => void;

    const initPromise =  new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    const commands = {
      [AppCommandsEnum.INIT]: () => {
        resolveInit();
      },
      [AppCommandsEnum.UPDATE_STATS]: (values: StatsValues) => {
        enginePanel.Stats.update(values);
        enginePanel.MenuGui.updateFps(values[StatsNameEnum.UFPS]);
      },
      [AppCommandsEnum.EVENT]: (msg: string) => {
        enginePanel.EventLog?.log('event ' + msg, 'Hello ' + msg);
      },
    };

    this.engineWorker.onmessage = ({ data: { command, params } }) => {
      if (commands.hasOwnProperty(command)) {
        try {
          commands[command as keyof typeof commands]!(params);
        } catch (err) {
          console.error('error in engine panel message handler');
          console.error(err);
        }
      }
    };

    return initPromise;
  }

  run() {
    this.engineWorker.postMessage({
      command: EngineCommandsEnum.RUN
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
    const fpsPanel = new StatsPanel({ title: StatsNameEnum.FPS, fg: '#0ff', bg: '#022', graphHeight: 200 });
    const rpsPanel = new StatsPanel({ title: StatsNameEnum.RPS, fg: '#f80', bg: '#022', graphHeight: 200 });
    const upsPanel = new StatsPanel({ title: StatsNameEnum.UPS, fg: '#0f0', bg: '#020', graphHeight: 200 });
    const ufpsPanel = new StatsPanel({ title: StatsNameEnum.UFPS, fg: '#f50', bg: '#110', graphHeight: 5000 });
    // const unlockedFpsPanel = new StatsPanel(StatsNames.FPSU, '#f50', '#110');
    // const wasmHeapMem = new StatsPanel(StatsNames.WASM_HEAP, '#0b0', '#030');
    // this.mem_panel = new StatsPanel('MEM', '#ff0', '#330');
    stats.addPanel(fpsPanel);
    stats.addPanel(rpsPanel);
    stats.addPanel(upsPanel);
    stats.addPanel(ufpsPanel);
    // this._stats.addPanel(wasmHeapMem);
    // add mem stats panel
    // const memPanel = new MemoryStats(this._stats);
    return stats;
  }

  private initPanels() {
    const board = <HTMLDivElement>document.querySelector('#board');
    const row0 = document.createElement('div');
    row0.classList.add('row', 'row0');
    const row1 = document.createElement('div');
    row1.classList.add('row', 'row1');
    board.appendChild(row0);
    board.appendChild(row1);

    this.panels = {
      [AppPanelsIdEnum.ENGINE]: this.buildEnginePanel('3D View', board, row0),
      [AppPanelsIdEnum.VIEW]: this.buildViewPanel('View', board, row0),
    };

    // board.style.display = 'none';
  }

  private buildEnginePanel(
    title: string,
    board: HTMLDivElement,
    parentNode: HTMLDivElement,
  ) {
    const { enginePanelConfig } = mainConfig;
    // parentNode.style.zIndex = '1'; // TODO:
    const panelConfig: EnginePanelConfig = {
      ...enginePanelConfig,
      // startViewMode: StartViewMode.FULL_WIN,
      // startViewMode: StartViewMode.WIN,
      title,
      id: AppPanelsIdEnum.ENGINE,
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

  private buildViewPanel(
    title: string,
    board: HTMLDivElement,
    parentNode: HTMLDivElement,
  ): ViewPanel {
    const { viewPanelConfig } = mainConfig;
    const panelConfig: ViewPanelConfig = {
      ...viewPanelConfig,
      startViewMode: StartViewMode.WIN,
      title,
      id: AppPanelsIdEnum.VIEW,
      // focusOnStart: true,
    };
    const viewPanel = new ViewPanel(board, parentNode);
    viewPanel.init(panelConfig, this.stats);
    return viewPanel;
  }
}

export { App };
