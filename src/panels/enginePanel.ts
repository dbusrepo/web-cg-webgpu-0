import assert from 'assert';
import { EnginePanelConfig } from '../config/mainConfig';
import { Stats } from '../ui/stats/stats';
import { StatsPanel } from '../ui/stats/statsPanel';
// import { MemoryStats } from '../ui/stats/memoryStats';
import { Panel } from './panel';
import { EnginePanelGui } from './enginePanelGui';
import { StatsNames, StatsValues } from '../common';
import { EngineConfig } from '../engine/engine';
import Commands from './enginePanelCommands';

const buildEngineWorker = () =>
  new Worker(new URL('../engine/engine.ts', import.meta.url));

class EnginePanel extends Panel {
  private _engineWorker: Worker;
  private _stats?: Stats;

  init(config: EnginePanelConfig): EnginePanel {
    super.init({
      ...config,
    });
    this.initStats();
    return this;
  }

  initEngineWorker(): void {
    this._engineWorker = buildEngineWorker();

    let enginePanel = this;

    const commands = {
      [Commands.UPDATESTATS]: (values: StatsValues) => {
        enginePanel._stats?.update(values);
      },
      [Commands.EVENT]: (msg: string) => {
        // console.log(msg);
        enginePanel.eventLog?.log('event ' + msg, 'Hello ' + msg);
      },
      [Commands.REGISTER_KEYDOWN_HANDLER]: (key: string) => {
        enginePanel.canvasContainerEl.addEventListener('keydown', (event) => {
          if (event.code !== key) {
            return;
          }
          enginePanel._engineWorker.postMessage({
            command: 'keydown',
            params: key,
          });
        });
      },
      [Commands.REGISTER_KEYUP_HANDLER]: (key: string) => {
        enginePanel.canvasContainerEl.addEventListener('keyup', (event) => {
          if (event.code !== key) {
            return;
          }
          enginePanel._engineWorker.postMessage({
            command: 'keyup',
            params: key,
          });
        });
      },
    };

    this._engineWorker.onmessage = ({ data: { command, params } }) => {
      if (commands.hasOwnProperty(command)) {
        try {
          commands[command as keyof typeof commands]!(params);
        } catch (err) {}
      }
    };
  }

  get config(): EnginePanelConfig {
    return super.config as EnginePanelConfig;
  }

  private initStats() {
    if (!this.isStatsEnable) {
      this.config.statsConfig.show = false;
      return;
    }
    this._stats = new Stats();
    const fpsPanel = new StatsPanel(StatsNames.FPS, '#0ff', '#022');
    const upsPanel = new StatsPanel(StatsNames.UPS, '#0f0', '#020');
    const unlockedFpsPanel = new StatsPanel(StatsNames.UFPS, '#f50', '#110');
    // const wasmHeapMem = new StatsPanel(StatsNames.WASM_HEAP, '#0b0', '#030');
    // this.mem_panel = new StatsPanel('MEM', '#ff0', '#330');
    this._stats.addPanel(fpsPanel);
    this._stats.addPanel(upsPanel);
    // this._stats.addPanel(wasmHeapMem);
    this._stats.addPanel(unlockedFpsPanel);
    // add mem stats panel
    // const memPanel = new MemoryStats(this._stats);
  }

  protected initMenuGui(): void {
    // const menuGuiConfig: EnginePanelMenuConfig = {
    //   ...this.config.menuConfig,
    // };
    if (!this._menuGui) {
      this._menuGui = new EnginePanelGui();
    }
    this._menuGui.init(this);
  }

  protected setFullStyle(): void {
    super.setFullStyle();
    if (this._stats) {
      this._stats.setParentNode(this.panelEl);
      this.setShowStats(this.showStats);
    }
  }

  protected setWinStyle(): void {
    super.setWinStyle();
    if (this._stats) {
      this._stats.setParentNode(this.boardEl);
      this.setShowStats(this.showStats);
    }
  }

  private runEngineWorker(): void {
    const offCanvas = this.canvasEl.transferControlToOffscreen();
    const engineConfig: EngineConfig = {
      canvas: offCanvas,
      sendStats: !!this._stats,
      // usePalette: false,
    };
    this._engineWorker.postMessage(
      {
        command: 'run',
        params: engineConfig,
      },
      [offCanvas],
    );
  }

  protected toWinStyle(): void {
    console.trace('toWinStyle');
    super.toWinStyle();
    if (this._stats) {
      this.setShowStats(true);
    }
  }

  protected hide(): void {
    super.hide();
    if (this._stats) {
      this.setShowStats(false);
    }
  }

  public setShowStats(show: boolean): void {
    assert(this._stats);
    this.config.statsConfig.show = show;
    // console.trace('setShowStats', show);
    if (show) {
      this._stats.show();
    } else {
      this._stats.hide();
    }
  }

  public get isStatsEnable(): boolean {
    return this.config.statsConfig.enable;
  }

  public get showStats(): boolean {
    return this.config.statsConfig.show;
  }

  protected destroy() {
    super.destroy();
  }

  run() {
    super.run();
    // this.initEngineWorker();
    // this.runEngineWorker();
  }
}

export { EnginePanel };
