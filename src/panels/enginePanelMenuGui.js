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
    this._gui.Register({
      type: 'folder',
      label: 'Stats',
      open: false,
    });

    /* VISIBLE CHECKBOX */
    const key = this.config.MENU_OPTIONS.STATS;
    this.options[key] = this.panel.showStats;
    this._gui.Register(
      {
        type: 'checkbox',
        label: 'visible',
        object: this.options,
        property: key,
        initial: this.options[key],
        onChange: (visible) => {
          this.panel.setShowStats(visible);
        },
      },
      {
        folder: 'Stats',
      },
    );
  }

  get panel() {
    return super.panel;
  }

  get config() {
    return super.config;
  }
}

export { EnginePanelMenuGui };
