import { type MonitorBindingApi } from 'tweakpane';
import { PanelGui, type PanelTweakOptions } from './panelGui';
import { type EnginePanel } from './enginePanel';
import MaxDeque from '../ds/maxDeque';

enum EnginePanelTweakOptionsEnum {
  FPS = 'fps',
}

type EnginePanelTweakOptions = PanelTweakOptions & {
  [EnginePanelTweakOptionsEnum.FPS]: number;
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
      [EnginePanelTweakOptionsEnum.FPS]: 50,
    };
  }

  protected addTweakPaneOptions(): void {
    super.addStatsOpt();
    super.addEventLogOpt();
    const BUF_SIZE = 64;

    // https://github.com/cocopon/tweakpane/issues/415
    // disable monitor interval and update it only in updateFps ? use
    // interval: 0,

    this.fpsMonitor = this.tweakPane.addBinding(
      this.tweakOptions,
      EnginePanelTweakOptionsEnum.FPS,
      {
        readonly: true,
        view: 'graph',
        // interval: 100,
        interval: 0,
        min: 0,
        // max: 100,
        max: 1000,
        bufferSize: BUF_SIZE,
      },
    ) as MonitorBindingApi<number>;
    this.fpsMonitor.label = 'FPS'; // `${fps.toFixed(0)} FPS`; // TODO: use padding
    this.maxDeque = new MaxDeque(BUF_SIZE);
    // this.fpsMonitor.disabled = true;
  }

  updateFpsGraph(fps: number): void {
    if (!Number.isFinite(fps)) {
      return;
    }

    fps = Math.trunc(fps);
    this.maxDeque.push(fps);
    this.tweakOptions[EnginePanelTweakOptionsEnum.FPS] = fps;
    // this.fpsMonitor.label = 'FPS'; // `${fps.toFixed(0)} FPS`; // TODO: use padding

    // https://github.com/cocopon/tweakpane/issues/371
    // recent issues about updating graph/fps monitor value:
    // https://github.com/cocopon/tweakpane/issues/360
    // https://github.com/cocopon/tweakpane/issues/582

    const SCALE = 1.5;
    const max = Math.trunc((this.maxDeque.max ?? 1) * SCALE);

    // @ts-expect-error props does not exists ? TODO check
    this.fpsMonitor.controller.valueController.props.valMap_.max.value_ = max;
    this.fpsMonitor.refresh();
  }

  // get panel(): EnginePanel {
  //   return super.panel as EnginePanel;
  // }
}

export { EnginePanelGui };
