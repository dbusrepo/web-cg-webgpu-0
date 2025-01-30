// import assert from 'assert';
import { type ViewPanelConfig } from '../config/mainConfig';
import { Panel } from './panel';
import { type Stats } from '../ui/stats/stats';
import { ViewPanelGui } from './viewPanelGui';
import { ViewPanelInputKeysEnum } from './viewPanelTypes';

class ViewPanel extends Panel {
  protected menuGui: ViewPanelGui;

  init(config: ViewPanelConfig, stats: Stats): void {
    super.init(config, stats);
    this.initInput();
  }

  private initInput(): void {
    this.inputKeys = new Set(Object.values(ViewPanelInputKeysEnum));
  }

  get config(): ViewPanelConfig {
    return super.config as ViewPanelConfig;
  }

  // protected buildConsoleHandlers(): ConsoleHandlersObjInit {
  //   const consoleHandlers = super.buildConsoleHandlers();
  //   return { ...consoleHandlers }; // TODO augment ?
  // }

  // async setFullScreen(enable: boolean): Promise<void> {
  //   await super.setFullScreen(enable);
  // }

  protected createPanelGui(): ViewPanelGui {
    return new ViewPanelGui();
  }
}

export { ViewPanel };
