import {
  EnginePanelMenuConfig,
  enginePanelConfig,
} from '../config/enginePanelConfig';
import { PanelMenuOptions, PanelMenuGui } from './panelMenuGui';
import { EnginePanel } from './enginePanel';

const STATS_OPT_KEY = Symbol(enginePanelConfig.menuConfig.options.stats.key);

type EnginePanelMenuOptions = {
  [STATS_OPT_KEY]: boolean;
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
    const { label } = enginePanelConfig.menuConfig.options.stats;

    const folder = label;

    this._gui.Register({
      type: 'folder',
      label: folder,
      open: false,
    });

    const initial = this.panel.showStats;
    this.menuOptions[STATS_OPT_KEY] = initial;

    this._gui.Register(
      {
        type: 'checkbox',
        label,
        object: this.menuOptions,
        property: STATS_OPT_KEY,
        initial,
        onChange: (visible: boolean) => {
          this.panel.setShowStats(visible);
        },
      },
      {
        folder,
      },
    );
  }

  get menuOptions(): EnginePanelMenuOptions {
    return super.menuOptions as EnginePanelMenuOptions;
  }

  get panel(): EnginePanel {
    return super.panel as EnginePanel;
  }

  get config(): EnginePanelMenuConfig {
    return super.config as EnginePanelMenuConfig;
  }
}

export { EnginePanelMenuGui };
