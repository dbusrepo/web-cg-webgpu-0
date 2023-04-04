import { PanelGui, PanelTweakOptions } from './panelGui';
import { EnginePanel } from './enginePanel';

enum TweakOptionsKeys {
  EP_OPT = 'EP_OPT',
}

type EnginePanelTweakOptions = PanelTweakOptions & {
  [TweakOptionsKeys.EP_OPT]: boolean;
};

class EnginePanelGui extends PanelGui {
  init(panel: EnginePanel) {
    super.init(panel);
  }

  get tweakOptions() {
    return super._tweakOptions as EnginePanelTweakOptions;
  }

  protected _initTweakPaneOptions() {
    super._initTweakPaneOptions();
    // const tweakOptions = this.tweakOptions;

    // let tweakOptions = this._tweakOptions;
    // if (!tweakOptions) {
    //   tweakOptions = {
    //     stats: this.panel.isStatsVisible,
    //   };
    // }
    // const statsInput = this._tweakPane.addInput(tweakOptions, 'stats');
    // statsInput.on('change', () => {
    //   this.panel.setStatsVisible(tweakOptions.stats);
    //   PanelGui.updateStatsOptPanels(this);
    // });
    // this._tweakOptions = tweakOptions;
    // this._tweakPane.addInput(this._tweakPaneOptions, 'fps');
    // this._tweakPane.addMonitor(this._tweakPaneOptions, 'level', {
    //   view: 'graph',
    //   min: -1,
    //   max: +1,
    // });
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
