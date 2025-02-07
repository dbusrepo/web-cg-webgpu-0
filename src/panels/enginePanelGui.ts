import { type MonitorBindingApi } from 'tweakpane';
import { PanelGui, type PanelTweakOptions } from './panelGui';
import { type EnginePanel } from './enginePanel';
import MaxDeque from '../ds/maxDeque';

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
  private maxDeque: MaxDeque;

  init(panel: EnginePanel): void {
    super.init(panel);
  }

  protected initTweakPaneOptionsObj(): void {
    super.initTweakPaneOptionsObj();
    this.tweakOptions = {
      ...this.tweakOptions,
      [EnginePanelTweakOptionsKeys.FPS]: 50,
    };
  }

  protected addTweakPaneOptions(): void {
    super.addStatsOpt();
    super.addEventLogOpt();
    const bufferSize = 64;
    // https://github.com/cocopon/tweakpane/issues/415
    // disable monitor interval and update it only in updateFps ? use
    // interval: 0,

    this.fpsMonitor = this.tweakPane.addBinding(
      this.tweakOptions,
      EnginePanelTweakOptionsKeys.FPS,
      {
        readonly: true,
        view: 'graph',
        // interval: 100,
        interval: 0,
        min: 0,
        // max: 100,
        // max: 1000,
        bufferSize,
      },
    ) as MonitorBindingApi<number>;
    this.maxDeque = new MaxDeque(bufferSize);
    // this.fpsMonitor.disabled = true;
  }

  updateFps(fps: number): void {
    this.maxDeque.push(fps);
    this.tweakOptions[EnginePanelTweakOptionsKeys.FPS] = fps;
    this.fpsMonitor.label = 'FPS'; // `${fps.toFixed(0)} FPS`; // TODO: use padding

    const max = (this.maxDeque.max ?? 0) * 1.5;

    // https://github.com/cocopon/tweakpane/issues/371
    // recent issues about updating graph/fps monitor value:
    // https://github.com/cocopon/tweakpane/issues/360
    // https://github.com/cocopon/tweakpane/issues/582

    // @ts-expect-error props does not exist ? check TODO
    this.fpsMonitor.controller.valueController.props.valMap_.max.value_ = max;
    this.fpsMonitor.refresh();
  }

  // get panel(): EnginePanel {
  //   return super.panel as EnginePanel;
  // }
}

export { EnginePanelGui };
