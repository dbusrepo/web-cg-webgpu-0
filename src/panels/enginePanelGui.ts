import { PanelGui } from './panelGui';
import { EnginePanel } from './enginePanel';

// each panel has its own tweak pane options
type EnginePanelTweakOptions = {
  // [k: string]: any;
  // level: number;
  // name: string;
  // active: boolean;
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
        stats: this.panel.isStatsVisible,
      };
    }
    const statsInput = this._tweakPane.addInput(tweakOptions, 'stats');
    statsInput.on('change', () => {
      this.panel.setStatsVisible(tweakOptions.stats);
      PanelGui.updateStatsOptPanels(this);
    });
    this._tweakOptions = tweakOptions;

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
