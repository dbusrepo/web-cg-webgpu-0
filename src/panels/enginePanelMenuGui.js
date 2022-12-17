import { MenuGui } from './menuGui';
// import { EnginePanelMenuConfig } from '../config/config';
// import { EnginePanel } from './enginePanel';

class EnginePanelMenuGui extends MenuGui {
  init(panel, menuConfig) {
    super.init(panel, menuConfig);
  }

  addPanelOptions() {
    super.addPanelOptions();
    if (this.panel.isStatsEnabled) {
      this.addStatsOptions();
    }
  }

  addStatsOptions() {
    // const key = this.config.MENU_OPTIONS.STATS;
    // this.menuOptions[key] = this.panel.showStats;
    // this.gui
    //   .add(this.menuOptions, key)
    //   .name(this.config.MENU_OPTIONS.STATS)
    //   .onChange((visible: boolean) => {
    //     this.panel.setShowStats(visible);
    //   });
  }

  get panel() {
    return super.panel;
  }

  get config() {
    return super.config;
  }
}

export { EnginePanelMenuGui };
