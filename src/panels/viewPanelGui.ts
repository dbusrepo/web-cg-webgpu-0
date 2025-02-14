// import { Panel } from './panel';
import { PanelGui, type PanelTweakOptions } from './panelGui';
import { type ViewPanel } from './viewPanel';

enum ViewPanelTweakOptionsEnum {
  VP_OPT = 'VP_OPT',
}

type ViewPanelTweakOptions = PanelTweakOptions & {
  [ViewPanelTweakOptionsEnum.VP_OPT]: boolean;
};

class ViewPanelGui extends PanelGui {
  protected panel: ViewPanel;
  protected tweakOptions: ViewPanelTweakOptions;

  init(panel: ViewPanel): void {
    super.init(panel);
  }

  // protected initTweakPaneOptionsObj(): void {
  //   super.initTweakPaneOptionsObj();
  // }

  protected addTweakPaneOptions(): void {
    super.addStatsOpt();
    super.addEventLogOpt();
  }
}

export { ViewPanelGui };
