// import assert from 'assert';
import './css/app.css';
import {
  StartViewMode,
  EnginePanelConfig,
  ViewPanelConfig,
  mainConfig,
} from './config/mainConfig';
import { Panel } from './panels/panel';
import { EnginePanel } from './panels/enginePanel';
import { ViewPanel } from './panels/viewPanel';
import { Stats } from './ui/stats/stats';
import { StatsPanel } from './ui/stats/statsPanel';
import { StatsNames } from './common';

class Main {
  private panels: Panel[];

  init() {
    this.initPanels();
  }

  initPanels(): void {
    const board = <HTMLDivElement>document.querySelector('#board');
    const row0 = document.createElement('div');
    row0.classList.add('row', 'row0');
    const row1 = document.createElement('div');
    row1.classList.add('row', 'row1');
    board.appendChild(row0);
    board.appendChild(row1);
    const stats = this.initStats();
    this.panels = [];
    // const enginePanel = null;
    const enginePanel = this.buildEnginePanel('3D View', board, row0, stats);
    this.panels.push(enginePanel);
    // const aPanel = this.buildViewPanel('View', board, row0, stats);
    // this.panels.push(aPanel);
    // board.style.display = 'none';
    // const aPanel2 = this.buildViewPanel('View', board, row1);
    // this.panels.push(aPanel2);
  }

  private initStats() {
    const stats = new Stats();
    const fpsPanel = new StatsPanel(StatsNames.FPS, '#0ff', '#022');
    const upsPanel = new StatsPanel(StatsNames.UPS, '#0f0', '#020');
    const unlockedFpsPanel = new StatsPanel(StatsNames.FPSU, '#f50', '#110');
    // const wasmHeapMem = new StatsPanel(StatsNames.WASM_HEAP, '#0b0', '#030');
    // this.mem_panel = new StatsPanel('MEM', '#ff0', '#330');
    stats.addPanel(fpsPanel);
    stats.addPanel(upsPanel);
    // this._stats.addPanel(wasmHeapMem);
    stats.addPanel(unlockedFpsPanel);
    // add mem stats panel
    // const memPanel = new MemoryStats(this._stats);
    return stats;
  }

  private buildEnginePanel(
    title: string,
    board: HTMLDivElement,
    parentNode: HTMLDivElement,
    stats: Stats,
  ): EnginePanel {
    const { enginePanelConfig } = mainConfig;
    parentNode.style.zIndex = '1'; // TODO
    const panelConfig: EnginePanelConfig = {
      ...enginePanelConfig,
      // startViewMode: StartViewMode.FULL_WIN,
      startViewMode: StartViewMode.WIN,
      title,
      focusOnStart: true,
      statsConfig: {
        ...enginePanelConfig.statsConfig,
        // enable: false,
        // isVisible: false,
      },
    };
    return new EnginePanel(board, parentNode).init(panelConfig, stats);
  }

  private buildViewPanel(
    title: string,
    board: HTMLDivElement,
    parentNode: HTMLDivElement,
    stats: Stats,
  ): ViewPanel {
    const { viewPanelConfig } = mainConfig;
    const panelConfig: ViewPanelConfig = {
      ...viewPanelConfig,
      startViewMode: StartViewMode.WIN,
      title,
    };
    return new ViewPanel(board, parentNode).init(panelConfig, stats);
  }

  run() {
    this.init();
    this.panels.forEach((panel) => {
      panel.run();
    });
  }
}

window.onload = async () => {
  // console.log("isolated:" + self.crossOriginIsolated);
  new Main().run();
};
