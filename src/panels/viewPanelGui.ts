import { PanelGui, PanelTweakOptions } from './panelGui';
import { ViewPanel } from './viewPanel';

enum TweakOptionsKeys {
  VP_OPT = 'VP_OPT',
}

type ViewPanelTweakOptions = PanelTweakOptions & {
  [TweakOptionsKeys.VP_OPT]: boolean;
};

class ViewPanelGui extends PanelGui {
  init(panel: ViewPanel) {
    super.init(panel);
  }

  get tweakOptions() {
    return super._tweakOptions as ViewPanelTweakOptions;
  }

  protected _initTweakPaneOptions() {
    super._initTweakPaneOptions();
    // const tweakOptions = this.tweakOptions;

    // TODO:
    // this.addPanelOptions();
    // this.initConsoleOptions();
    // this.addEventLogFolderOptions();
    // if (!this._panel.isFullScreen) {
    //   this.addOptFullWin();
    // }
    // this.addFullscreenOption();
  }
}

export { ViewPanelGui };
