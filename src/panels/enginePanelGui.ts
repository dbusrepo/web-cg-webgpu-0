import { MonitorBindingApi } from 'tweakpane';
import { PanelGui, PanelTweakOptions, PanelTweakOptionsKeys } from './panelGui';
import { EnginePanel } from './enginePanel';
import { Panel } from './panel';

enum EnginePanelTweakOptionsKeys {
  FPS = 'fps',
}

type EnginePanelTweakOptions = PanelTweakOptions & {
  [EnginePanelTweakOptionsKeys.FPS]: number;
};

class EnginePanelGui extends PanelGui {
  protected panel: EnginePanel;
  protected tweakOptions: EnginePanelTweakOptions;
  private fpsMonitor: MonitorBindingApi<number>;

  init(panel: EnginePanel) {
    super.init(panel);
  }

  protected initTweakPaneOptionsObj(): void {
    super.initTweakPaneOptionsObj();
    this.tweakOptions = {
      ...this.tweakOptions,
      [EnginePanelTweakOptionsKeys.FPS]: 50,
    };
  }

  protected addTweakPaneOptions() {
    super.addStatsOpt();
    super.addEventLogOpt();
    this.fpsMonitor = this.tweakPane.addMonitor(
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
    // this.fpsMonitor.disabled = true;
  }

  updateFps(fps: number) {
    this.tweakOptions[EnginePanelTweakOptionsKeys.FPS] = fps;
    this.fpsMonitor.refresh();
  }

  // get panel(): EnginePanel {
  //   return super.panel as EnginePanel;
  // }
}

export { EnginePanelGui };
