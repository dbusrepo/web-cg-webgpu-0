import {
  EnginePanelMenuConfig,
  enginePanelConfig,
} from '../config/enginePanelConfig';
import { PanelGui, PanelTweakOptions } from './panelGui';
import { EnginePanel } from './enginePanel';

const STATS_OPT_KEY = Symbol(enginePanelConfig.menuConfig.options.stats.key);

type EnginePanelTweakOptions = {
  [STATS_OPT_KEY]: boolean;
} & PanelTweakOptions;

class EnginePanelMenuGui extends PanelGui {
  init(panel: EnginePanel, menuConfig: EnginePanelMenuConfig) {
    super.init(panel, menuConfig);
  }

  protected _initTweakPaneOptions() {
    super._initTweakPaneOptions();
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

  get tweakPaneOptions(): EnginePanelTweakOptions {
    return super._tweakPaneOptions as EnginePanelTweakOptions;
  }
  
  get panel(): EnginePanel {
    return super.panel as EnginePanel;
  }

  get config(): EnginePanelMenuConfig {
    return super.config as EnginePanelMenuConfig;
  }
}

export { EnginePanelMenuGui };
