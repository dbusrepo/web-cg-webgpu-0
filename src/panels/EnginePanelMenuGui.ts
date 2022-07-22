import assert from 'assert';
import { EnginePanelMenuConfig } from '../config/config';
import { MenuGui } from './menuGui';
import { EnginePanel } from './enginePanel';

class EnginePanelMenuGui extends MenuGui {

  init(panel: EnginePanel, menuConfig: EnginePanelMenuConfig) {
    super.init(panel, menuConfig);
  }

  protected addPanelOptions(): void {
    super.addPanelOptions();
    if (this.panel.isStatsEnabled) {
      this.addStatsOptions();
    }
  }

  private addStatsOptions(): void {
    const key = this.config.MENU_OPTIONS.STATS;
    this.menuOptions[key] = this.panel.showStats;
    this.gui
      .add(this.menuOptions, key)
      .name(this.config.MENU_OPTIONS.STATS)
      .onChange((visible: boolean) => {
        this.panel.setShowStats(visible);
      });
  }

  get panel(): EnginePanel {
    return super.panel as EnginePanel;
  }

  get config(): EnginePanelMenuConfig {
    return super.config as EnginePanelMenuConfig;
  }

}

export { EnginePanelMenuGui, EnginePanelMenuConfig };
