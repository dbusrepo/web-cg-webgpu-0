// import assert from 'assert';
import { StatsPanel } from './statsPanel';
import { StatsConfig } from './statsConfig';

enum StatsNames {
  FPS = 'FPS',
  RPS = 'RPS',
  UPS = 'UPS',
  UFPS = 'UFPS',
  // MEM = 'MEM',
  // WASM_HEAP = 'WASM_HEAP', // heap mem allocated by wasm workers in the private heap + in the shared heap
}

type StatsValues = {
  -readonly [property in keyof typeof StatsNames]: number;
};

class Stats {
  private cfg: StatsConfig;
  private container: HTMLDivElement;
  private panels = new Map<string, StatsPanel>();

  init(cfg: StatsConfig) {
    this.cfg = structuredClone(cfg);
    this.container = document.createElement('div');
    this.container.classList.add('stats-container');
    // this.schedule_mem_measure(); // TODO move ? remove?
  }

  addPanel(statsPanel: StatsPanel) {
    this.panels.set(statsPanel.Title, statsPanel);
    this.container.appendChild(statsPanel.dom);
  }

  setParentNode(parentNode: HTMLElement): void {
    this.container.parentNode?.removeChild(this.container);
    parentNode.appendChild(this.container);
  }

  hide() {
    this.container.style.display = 'none';
    // this.container.style.zIndex = '1';
  }

  show() {
    this.container.style.display = 'block';
    // this.container.style.zIndex = '10000';
  }

  update(stats: { [k: string]: number }): void {
    for (const [k, v] of Object.entries(stats)) {
      const panel = this.panels.get(k);
      if (panel) {
        panel.update(v);
      }
    }
  }

  public get isVisible(): boolean {
    return this.cfg.isVisible;
  }

  public set isVisible(value: boolean) {
    this.cfg.isVisible = value;
  }
}

export { Stats, StatsNames, StatsValues };
