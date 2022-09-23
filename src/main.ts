import assert from 'assert';
import './css/app.css';
import { StartViewMode, EnginePanelConfig, ViewPanelConfig, defaultConfig } from './config/config';
import { Panel } from './panels/panel';
import { EnginePanel } from './panels/enginePanel';
import { ViewPanel } from './panels/viewPanel';

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
    this.panels = [];
    const enginePanel = this.buildEnginePanel('3D View', board, row0);
    // const enginePanel = null;
    // const aPanel = this.buildViewPanel('Panel', board, row0);
    // this.panels.push(aPanel);
    this.panels.push(enginePanel);
    board.style.display = 'none';
    // this.panels.push(this.buildViewPanel('Panel 2', board, row1));
  }

  private buildEnginePanel(
    name: string,
    board: HTMLDivElement,
    parentNode: HTMLDivElement,
  ): EnginePanel {
    const { enginePanelConfig } = defaultConfig;
    parentNode.style.zIndex = '1'; // TODO
    const panelConfig: EnginePanelConfig = {
      ...enginePanelConfig,
      startViewMode: StartViewMode.WIN,
      name,
      focusOnStart: true,
      statsConfig: {
        ...enginePanelConfig.statsConfig,
        enable: true,
        // isVisible: false,
      },
    };
    return new EnginePanel(board, parentNode).init(panelConfig);
  }

  private buildViewPanel(
    name: string,
    board: HTMLDivElement,
    parentNode: HTMLDivElement,
  ): ViewPanel {
    const { viewPanelConfig } = defaultConfig;
    const panelConfig: ViewPanelConfig = {
      ...viewPanelConfig,
      startViewMode: StartViewMode.WIN,
      name,
    };
    return new ViewPanel(board, parentNode).init(panelConfig);
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
