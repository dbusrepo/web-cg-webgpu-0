import assert from 'assert';
import { EnginePanelConfig } from '../config/config';
import { Stats } from '../ui/stats/stats';
import { StatsPanel } from '../ui/stats/statsPanel';
import { MemoryStats } from '../ui/stats/memoryStats';
import { Panel } from './panel';
import {
  EnginePanelMenuGui,
  EnginePanelMenuConfig,
} from './EnginePanelMenuGui';
import { StatsNames, StatsValues } from '../common';
import { EngineConfig } from '../engine/engine';

const buildEngineWorker = () =>
  new Worker(new URL('../engine/engine.ts', import.meta.url));

class EnginePanel extends Panel {
  private _engineWorker: Worker;
  private _stats?: Stats;

  // constructor(mainBoard: HTMLDivElement, parentNode: HTMLDivElement) {
  //   super(mainBoard, parentNode);
  // }

  init(config: EnginePanelConfig): EnginePanel {
    super.init({
      ...config,
    });
    this.initStats();
    return this;
  }

  get config(): EnginePanelConfig {
    return super.config as EnginePanelConfig;
  }

  private initStats() {
    if (!this.isStatsEnabled) {
      return;
    }
    this.showStats = this.config.statsConfig.show;
    this._stats = new Stats(this.panel);
    const fpsPanel = new StatsPanel(StatsNames.FPS, '#0ff', '#022');
    const upsPanel = new StatsPanel(StatsNames.UPS, '#0f0', '#020');
    // const unlockedFpsPanel = new StatsPanel( // TODO
    //   EngineStatsNames.UFPS,
    //   '#f50',
    //   '#110',
    // );
    // this.mem_panel = new StatsPanel('MEM', '#ff0', '#330');

    this._stats.addPanel(fpsPanel);
    this._stats.addPanel(upsPanel);
    const memPanel = new MemoryStats(this._stats);
    // this._stats.addPanel(unlockedFpsPanel);
    this.setShowStats(this.showStats);
  }

  initEngineWorker(): void {
    this._engineWorker = buildEngineWorker();

    let panel = this;

    const commands = {
      // TODO field ?
      ...(panel._stats && {
        updateStats(values: StatsValues): void {
          // console.log(values);
          panel._stats!.update(values);
        },
      }),
      log(data: object): void {
        console.log(data);
      },
    };

    this._engineWorker.addEventListener(
      'message',
      async ({ data: { command, params } }) => {
        if (commands.hasOwnProperty(command)) {
          try {
            commands[command as keyof typeof commands]!(params);
          } catch (err) {}
        }
      },
    );
  }

  protected initMenuGui(): void {
    if (!this.config.enableMenuGui) {
      return;
    }
    const menuGui = new EnginePanelMenuGui();
    const menuGuiConfig: EnginePanelMenuConfig = {
      ...this.config.menuConfig,
    };
    menuGui.init(this, menuGuiConfig);
    this._menuGui = menuGui;
  }

  protected setFullStyle(): void {
    super.setFullStyle();
    if (this._stats) {
      this._stats.setParentNode(this.panel);
    }
  }

  protected setWinStyle(): void {
    super.setWinStyle();
    if (this._stats) {
      this._stats.setParentNode(this.board);
    }
  }

  protected initPreRun(): void {}

  private runEngineWorker(): void {
    const offCanvas = this.canvas.transferControlToOffscreen();
    const engineConfig: EngineConfig = {
      canvas: offCanvas,
      sendStats: !!this._stats,
      usePalette: false,
    };
    this._engineWorker.postMessage(
      {
        command: 'run',
        params: engineConfig,
      },
      [offCanvas],
    );
  }

  run() {
    super.run();
    this.initEngineWorker();
    this.runEngineWorker();
  }

  public setShowStats(show: boolean): void {
    assert(this._stats);
    this.showStats = show;
    if (show) {
      this._stats!.show();
    } else {
      this._stats!.hide();
    }
  }

  // protected destroy() {
  //   super.destroy();
  // }

  // get stats(): Stats | null {
  //   return this._stats ?? null;
  // }

  // set stats(stats: Stats | null) {
  //   this._stats = stats ?? undefined;
  // }

  get isStatsEnabled(): boolean {
    return this.config.statsConfig.enable;
  }

  get showStats(): boolean {
    return this.config.statsConfig.show;
  }

  set showStats(value: boolean) {
    this.config.statsConfig.show = value;
  }
}

export { EnginePanel };
