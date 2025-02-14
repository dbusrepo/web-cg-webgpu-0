// import assert from 'assert';
import { type StatsPanel } from './statsPanel';
import { type StatsConfig } from './statsConfig';
import { dragElement } from '../drag';

enum FrameStatsEnum {
  FPS = 'FPS',
  UPS = 'UPS',
  UFPS = 'UFPS',
  FRAME_TIME_MS = 'FRAME_TIME_MS',
}

enum StatsEnum {
  MEM = 'MEM',
}

type WorkerStatKey = FrameStatsEnum;
type WorkerStatsUpdate = Record<WorkerStatKey, number>;
type StatKey = FrameStatsEnum | StatsEnum;
type StatsUpdate = Partial<Record<StatKey, number>>;

class Stats {
  private cfg: StatsConfig;
  private container: HTMLDivElement;
  private panels = new Map<StatKey, StatsPanel>();

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

  update(stats: StatsUpdate): void {
    for (const key of Object.keys(stats) as StatKey[]) {
      const value = stats[key];
      if (value !== undefined) {
        const panel = this.panels.get(key);
        if (panel) {
          panel.update(value);
        }
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

export type { WorkerStatsUpdate, StatKey };
export { Stats, FrameStatsEnum, StatsEnum };
