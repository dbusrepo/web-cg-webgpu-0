import { MonitorBindingApi } from 'tweakpane';
import { PanelGui, PanelTweakOptions, PanelTweakOptionsKeys } from './panelGui';
import { EnginePanel } from './enginePanel';

enum EnginePanelTweakOptionsKeys {
  FPS = 'fps',
}

type EnginePanelTweakOptions = PanelTweakOptions & {
  [EnginePanelTweakOptionsKeys.FPS]: number;
};

class EnginePanelGui extends PanelGui {
  private _fpsMonitor: MonitorBindingApi<number>;

  init(panel: EnginePanel) {
    super.init(panel);
  }

  get tweakOptions() {
    return this._tweakOptions as EnginePanelTweakOptions;
  }

  set tweakOptions(options: EnginePanelTweakOptions) {
    this._tweakOptions = options;
  }

  protected _initTweakPaneOptionsObj(): void {
    super._initTweakPaneOptionsObj();
    this.tweakOptions = {
      ...this._tweakOptions,
      [EnginePanelTweakOptionsKeys.FPS]: 50,
    };
  }

  protected _addTweakPaneOptions() {
    super._addStatsOpt();
    super._addEventLogOpt();
    this._fpsMonitor = this._tweakPane.addMonitor(
      this.tweakOptions,
      EnginePanelTweakOptionsKeys.FPS,
      {
        view: 'graph',
        interval: 100,
        min: 0,
        // max: 200,
        max: 10000,
      },
    );
    // https://github.com/cocopon/tweakpane/issues/415
    // disable monitor interval and update it only in updateFps ?
    // this._fpsMonitor.disabled = true;
  }

  updateFps(fps: number) {
    this.tweakOptions[EnginePanelTweakOptionsKeys.FPS] = fps;
    this._fpsMonitor.refresh();
  }

  get panel(): EnginePanel {
    return super.panel as EnginePanel;
  }
}

export { EnginePanelGui };
