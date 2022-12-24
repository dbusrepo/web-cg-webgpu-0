import { EnginePanelMenuConfig } from '../config/config';
import { MenuGui } from './menuGui';
import { EnginePanel } from './enginePanel';

class EnginePanelMenuGui extends MenuGui {
  init(panel: EnginePanel, menuConfig: EnginePanelMenuConfig) {
    super.init(panel, menuConfig);
  }

  addPanelOptions() {
    super.addPanelOptions();
    if (this.panel.isStatsEnabled) {
      this.addStatsOptions();
    }
  }

  addStatsOptions() {
    // this._gui.Register({
    //   type: 'folder',
    //   label: 'Stats',
    //   open: false,
    // });

    // const key = this.config.MENU_OPTIONS.STATS;
    // this.options[key] = this.panel.showStats;
    // this._gui.Register(
    //   {
    //     type: 'checkbox',
    //     label: 'visible',
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
  
  get panel(): EnginePanel {
    return super.panel as EnginePanel;
  }

  get config(): EnginePanelMenuConfig {
    return super.config as EnginePanelMenuConfig;
  }
}

export { EnginePanelMenuGui };
