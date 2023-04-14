// import assert from 'assert';
import { StatsPanel } from './statsPanel';
import { StatsConfig } from './statsConfig';

enum StatsNames {
  FPS = 'FPS',
  UPS = 'UPS',
  FPSU = 'FPSU',
  MEM = 'MEM',
  // WASM_HEAP = 'WASM_HEAP', // heap mem allocated by wasm workers in the private heap + in the shared heap
}

type StatsValues = {
  [property in keyof typeof StatsNames]: number;
};

class Stats {
  private _cfg: StatsConfig;
  private _container: HTMLDivElement;
  private _panels = new Map<string, StatsPanel>();

  init(cfg: StatsConfig) {
    this._cfg = structuredClone(cfg);
    this._container = document.createElement('div');
    this._container.classList.add('stats-container');
    // this.schedule_mem_measure(); // TODO move ? remove?
  }

  addPanel(statsPanel: StatsPanel) {
    this._panels.set(statsPanel.title, statsPanel);
    this._container.appendChild(statsPanel.dom);
  }

  setParentNode(parentNode: HTMLElement): void {
    this._container.parentNode?.removeChild(this._container);
    parentNode.appendChild(this._container);
  }

  hide() {
    this._container.style.display = 'none';
    // this.container.style.zIndex = '1';
  }

  show() {
    this._container.style.display = 'block';
    // this.container.style.zIndex = '10000';
  }

  update(stats: { [k: string]: number }): void {
    for (const [k, v] of Object.entries(stats)) {
      const panel = this._panels.get(k);
      if (panel) {
        panel.update(v);
      }
    }
  }

  public get isVisible(): boolean {
    return this._cfg.isVisible;
  }

  public set isVisible(value: boolean) {
    this._cfg.isVisible = value;
  }
}

export { Stats, StatsNames, StatsValues };
