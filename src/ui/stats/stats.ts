// import assert from 'assert';
import { type StatsPanel } from './statsPanel';
import { type StatsConfig } from './statsConfig';
import { dragElement } from '../drag';

enum StatsEnum {
  FPS = 'FPS',
  // RPS = 'RPS',
  UPS = 'UPS',
  UFPS = 'UFPS',
  FRAME_TIME_MS = 'FRAME_TIME_MS',
  MEM = 'MEM',
  // WASM_HEAP = 'WASM_HEAP', // heap mem allocated by wasm workers in the private heap + in the shared heap
}

type StatsValues = {
  -readonly [property in keyof typeof StatsEnum]?: number;
};

class Stats {
  private cfg: StatsConfig;
  private container: HTMLDivElement;
  private panels = new Map<StatsEnum, StatsPanel>();

  init(cfg: StatsConfig): void {
    this.cfg = structuredClone(cfg);
    this.container = document.createElement('div');
    this.container.classList.add('stats-container');
    dragElement(this.container);
    // this.schedule_mem_measure(); // TODO (re)move ?
  }

  setPos(x: number, y: number): void {
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
  }

  addPanel(statsPanel: StatsPanel): void {
    this.panels.set(statsPanel.Id, statsPanel);
    statsPanel.appendAsChild(this.container);
  }

  setParentNode(parentNode: HTMLElement): void {
    this.container.remove();
    parentNode.append(this.container);
  }

  hide(): void {
    this.container.style.visibility = 'hidden';
    // this.container.style.display = 'none';
    // this.container.style.zIndex = '1';
  }

  show(): void {
    this.container.style.visibility = 'visible';
    // this.container.style.display = 'block';
    // this.container.style.zIndex = '10000';
  }

  update(stats: StatsValues): void {
    for (const [k, v] of Object.entries(stats)) {
      const panel = this.panels.get(k as StatsEnum);
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

export type { StatsValues };
export { Stats, StatsEnum };
