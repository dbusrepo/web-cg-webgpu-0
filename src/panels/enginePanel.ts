import assert from 'assert';
import { EnginePanelConfig } from '../config/mainConfig';
import { Stats, StatsNames, StatsValues } from '../ui/stats/stats';
import { StatsPanel } from '../ui/stats/statsPanel';
// import { MemoryStats } from '../ui/stats/memoryStats';
import { Panel } from './panel';
import { EnginePanelGui } from './enginePanelGui';
import { EngineParams, EngineCommands } from '../engine/engine';
import EnginePanelCommands from './enginePanelCommands';

class EnginePanel extends Panel {
  protected menuGui: EnginePanelGui;
  private mainEngineWorker: Worker;
  private inputKeys: Set<string> = new Set();

  init(config: EnginePanelConfig, stats: Stats): EnginePanel {
    super.init({ ...config }, stats);
    this.initInputListeners();
    this.initMainEngineWorker();
    return this;
  }

  initInputListeners(): void {
    type KeyEvents = 'keydown' | 'keyup';

    const ignoreKeys = () => {
      return this.isConsoleOpen;
    };

    const addKeyListener = (type: KeyEvents) => (
      this.canvasContainerEl.addEventListener(type, (event) => {
        if (ignoreKeys() || !this.inputKeys.has(event.code)) {
          return;
        }
        this.mainEngineWorker.postMessage({
          command: type,
          params: event.code,
        });
      })
    );

    addKeyListener('keydown');
    addKeyListener('keyup');
  }

  initMainEngineWorker(): void {
    this.mainEngineWorker = new Worker(new URL('../engine/engine.ts', import.meta.url));

    this.setMainEngineWorkerHandlers();

    // init main engine worker
    const offscreenCanvas = this.canvasEl.transferControlToOffscreen();
    const engineParams: EngineParams = {
      canvas: offscreenCanvas,
    };
    this.mainEngineWorker.postMessage(
      {
        command: EngineCommands.INIT,
        params: engineParams,
      },
      [offscreenCanvas],
    );
  }

  private setMainEngineWorkerHandlers(): void {
    let enginePanel = this;

    const commands = {
      [EnginePanelCommands.UPDATE_STATS]: (values: StatsValues) => {
        enginePanel.stats.update(values);
        enginePanel.menuGui.updateFps(values[StatsNames.UFPS]);
      },
      [EnginePanelCommands.EVENT]: (msg: string) => {
        enginePanel.eventLog?.log('event ' + msg, 'Hello ' + msg);
      },
      [EnginePanelCommands.REGISTER_KEY_HANDLER]: (key: string) => {
        this.inputKeys.add(key);
      },
    };

    this.mainEngineWorker.onmessage = ({ data: { command, params } }) => {
      if (commands.hasOwnProperty(command)) {
        try {
          commands[command as keyof typeof commands]!(params);
        } catch (err) {
          console.error(err);
        }
      }
    };
  }

  get config(): EnginePanelConfig {
    return super.config as EnginePanelConfig;
  }

  protected createPanelGui(): EnginePanelGui {
    return new EnginePanelGui();
  }

  private runMainEngineWorker(): void {
    this.mainEngineWorker.postMessage({ 
      command: EngineCommands.RUN 
    });
  }

  protected destroy() {
    super.destroy();
  }

  run() {
    super.run();
    this.runMainEngineWorker();
  }
}

export { EnginePanel };
