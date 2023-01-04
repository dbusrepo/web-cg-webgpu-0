import { EnginePanelMenuConfig } from '../config/mainConfig';
import { PanelMenuOptions, PanelMenuGui } from './panelMenuGui';
import { EnginePanel } from './enginePanel';

type EnginePanelMenuOptions = {
  // [k: string]: any;
} & PanelMenuOptions;

class EnginePanelMenuGui extends PanelMenuGui {
  init(panel: EnginePanel, menuConfig: EnginePanelMenuConfig) {
    super.init(panel, menuConfig);
  }

  addPanelOptions() {
    super.addPanelOptions();
    if (this.panel.isStatsEnable) {
      this.addStatsOptions();
    }
  }

  addStatsOptions() {
    const { label } = this.config.MENU_OPTIONS.stats;

    // this._gui.Register({
    //   type: 'folder',
    //   label: 'Stats',
    //   open: false,
    // });

    // this.options[key] = this.panel.showStats;
    // this._gui.Register(
    //   {
    //     type: 'checkbox',
    //     label,
    //     object: this.options,
    //     property: key,
    //     initial: this.options[key],
    //     onChange: (visible) => {
    //       this.panel.setShowStats(visible);
    //     },
    //   },
    //   {
    //     folder: 'Stats',
    //   },
    // );
  }

  get menuOptions(): EnginePanelMenuOptions {
    return super.panel as EnginePanel;
  }

  get panel(): EnginePanel {
    return super.panel as EnginePanel;
  }

  get config(): EnginePanelMenuConfig {
    return super.config as EnginePanelMenuConfig;
  }
}

export { EnginePanelMenuGui };
