import { PanelGui, PanelTweakOptions } from './panelGui';
import { ViewPanel } from './viewPanel';

enum ViewPanelTweakOptionsKeys {
  VP_OPT = 'VP_OPT',
}

type ViewPanelTweakOptions = PanelTweakOptions & {
  [ViewPanelTweakOptionsKeys.VP_OPT]: boolean;
};

class ViewPanelGui extends PanelGui {
  init(panel: ViewPanel) {
    super.init(panel);
  }

  get tweakOptions() {
    return this._tweakOptions as ViewPanelTweakOptions;
  }

  protected _initTweakPaneOptionsObj(): void {
    super._initTweakPaneOptionsObj();
  }

  protected _addTweakPaneOptions() {
    super._addStatsOpt();
    super._addEventLogOpt();
  }
}

export { ViewPanelGui };
