import { PanelGui, TweakOptions } from './panelGui';
import { EnginePanel } from './enginePanel';

type EnginePanelTweakOptions = TweakOptions & {
  stats: boolean;
};

class EnginePanelGui extends PanelGui {
  init(panel: EnginePanel) {
    super.init(panel);
  }

  protected _initTweakPaneOptions() {
    let tweakOptions = this._tweakOptions as EnginePanelTweakOptions;
    if (!tweakOptions) {
      tweakOptions = {
        stats: this.panel.showStats,
      };
    }
    this._tweakPane.addInput(tweakOptions, 'stats', {
      disabled: !this.panel.isStatsEnable,
    });
    this._tweakOptions = tweakOptions;

    // super._initTweakPaneOptions();
    // this._tweakPane.addInput(this._tweakPaneOptions, 'fps');

    // this._tweakPane.addMonitor(this._tweakPaneOptions, 'level', {
    //   view: 'graph',
    //   min: -1,
    //   max: +1,
    // });

    // if (this.panel.isStatsEnable) {
    //   this.addStatsOptions();
    // }
  }

  // TODO
  // addStatsOptions() {
  // const { label } = enginePanelConfig.menuConfig.options.stats;
  // const initial = this.panel.showStats;
  // this.menuOptions[STATS_OPT_KEY] = initial;
  // const folder = label;
  // this._gui.Register({
  //   type: 'folder',
  //   label: folder,
  //   open: false,
  // });
  // this._gui.Register(
  //   {
  //     type: 'checkbox',
  //     label,
  //     object: this.menuOptions,
  //     property: STATS_OPT_KEY,
  //     initial,
  //     onChange: (visible: boolean) => {
  //       this.panel.setShowStats(visible);
  //     },
  //   },
  //   {
  //     folder,
  //   },
  // );
  // }

  // get tweakPaneOptions(): EnginePanelTweakOptions {
  //   return super._tweakPaneOptions as EnginePanelTweakOptions;
  // }

  get panel(): EnginePanel {
    return super.panel as EnginePanel;
  }
}

export { EnginePanelGui };
