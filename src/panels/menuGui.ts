// import assert from 'assert';
import { GUI, GUIParams, GUIController } from 'dat.gui';
import { Panel } from './panel';
import { PanelConfig } from '../config/config';

type MenuConfig = PanelConfig['menuConfig'];

type MenuOptions = {
  [k: string]: any;
};

class MenuGui {
  private _config: MenuConfig;
  private _panel: Panel;
  private _gui: GUI;
  private _menuOptions: MenuOptions;

  init(panel: Panel, menuConfig: MenuConfig): void {
    this._panel = panel;
    this._config = menuConfig;
    // GUI.prototype.addEventListerOnClose = function() {};
    GUI.TEXT_CLOSED = GUI.TEXT_OPEN = this._config.MENU_LABEL;
    this._gui = new GUI(menuConfig.guiParams);
    this._gui.domElement.id = this._config.DOM_ID;
    this._gui.close();
    this.getDom().classList.add(this._config.CSS_CLASS);
    this.initOptions();
    this.initPanel();
  }

  getDom(): HTMLElement {
    return this._gui.domElement;
  }

  private initPanel(): void {
    if (this._panel.panel !== this.getDom().parentNode) {
      this._panel.panel.appendChild(this.getDom());
    }
    this.setOnTop();
  }

  private setOnTop(): void {
    const parent = this._panel.canvasContainer;
    this.gui.domElement.style.zIndex = String(Number(parent.style.zIndex) + 1);
  }

  private removeMenuFromPanel(): void {
    this._panel.panel.removeChild(this.getDom());
  }

  private initOptions() {
    this._menuOptions = {};
    this.addPanelOptions();
    this.addConsoleFolderOptions();
    this.addEventLogFolderOptions();
    if (!this._panel.isFullScreen) {
      this.addOptFullWin();
    }
    this.addFullscreenOption();
  }

  protected addPanelOptions(): void {} // overidden...

  private addConsoleFolderOptions(): void {
    if (!this._panel.console) {
      return;
    }

    const consoleFolder = this._gui.addFolder(
      this._config.MENU_OPTIONS.CONSOLE,
    );

    const consoleOptionValues = {
      // event controllers default values here
      [this._config.CONSOLE_OPTIONS.FONT_SIZE]: this._config.DEFAULT_FONT_SIZE,
      [this._config.CONSOLE_OPTIONS.LINE_HEIGHT]:
        this._config.DEFAULT_LINE_HEIGHT,
    };

    const fontSizeController = consoleFolder.add(
      consoleOptionValues,
      this._config.CONSOLE_OPTIONS.FONT_SIZE,
      this._config.MIN_FONT_SIZE,
      this._config.MAX_FONT_SIZE,
      this._config.FONT_SIZE_STEP,
    );

    fontSizeController.onChange((fontSize: number) => {
      this._panel.setConsoleFontSize(fontSize);
    });

    const lineHeightController = consoleFolder.add(
      consoleOptionValues,
      this._config.CONSOLE_OPTIONS.LINE_HEIGHT,
      this._config.MIN_LINE_HEIGHT,
      this._config.MAX_LINE_HEIGHT,
      this._config.LINE_HEIGHT_STEP,
    );

    lineHeightController.onChange((lineHeight: number) => {
      this._panel.setConsoleLineHeight(lineHeight);
    });

    consoleFolder.close();
  }

  private addEventLogFolderOptions(): void {
    if (!this._panel.eventLog) {
      return;
    }

    const eventsFolder = this._gui.addFolder(this._config.MENU_OPTIONS.EVENTS);

    const eventLogStartModeValue = this._panel.isEventLogBelowCanvas
      ? this._config.EVENT_LOG_POSITION_VALUES.BOTTOM
      : this._config.EVENT_LOG_POSITION_VALUES.PANEL;

    const _isEventLogVisible = this._panel.isEventLogVisible;

    const eventOptionValues = {
      // event controllers default values here
      [this._config.EVENT_LOG_OPTIONS.POSITION]: eventLogStartModeValue,
      [this._config.EVENT_LOG_OPTIONS.FONT_SIZE]:
        this._config.DEFAULT_FONT_SIZE,
      [this._config.EVENT_LOG_OPTIONS.LINE_HEIGHT]:
        this._config.DEFAULT_LINE_HEIGHT,
      [this._config.EVENT_LOG_OPTIONS.VISIBLE]: _isEventLogVisible,
    };

    const logPositions = [
      this._config.EVENT_LOG_POSITION_VALUES.BOTTOM,
      this._config.EVENT_LOG_POSITION_VALUES.PANEL,
    ];

    const eventLogVisController = eventsFolder.add(
      eventOptionValues,
      this._config.EVENT_LOG_OPTIONS.VISIBLE,
    );

    eventLogVisController.onChange((value: boolean) => {
      this._panel.setEventLogVisibility(value);
    });

    eventsFolder
      .add(
        eventOptionValues,
        this._config.EVENT_LOG_OPTIONS.POSITION,
        logPositions,
      )
      .onChange((position) => {
        switch (position) {
          case this._config.EVENT_LOG_POSITION_VALUES.BOTTOM:
            if (!this._panel.isEventLogBelowCanvas) {
              this._panel.setEventLogBelowCanvas();
            }
            break;
          case this._config.EVENT_LOG_POSITION_VALUES.PANEL:
            if (this._panel.isEventLogBelowCanvas) {
              this._panel.setEventLogOnCanvas();
            }
            break;
          default:
            break;
        }
      });

    const fontSizeController = eventsFolder.add(
      eventOptionValues,
      this._config.EVENT_LOG_OPTIONS.FONT_SIZE,
      this._config.MIN_FONT_SIZE,
      this._config.MAX_FONT_SIZE,
      this._config.FONT_SIZE_STEP,
    );

    fontSizeController.onChange((fontSize: number) => {
      this._panel.setEventLogFontSize(fontSize);
    });

    const lineHeightController = eventsFolder.add(
      eventOptionValues,
      this._config.EVENT_LOG_OPTIONS.LINE_HEIGHT,
      this._config.MIN_LINE_HEIGHT,
      this._config.MAX_LINE_HEIGHT,
      this._config.LINE_HEIGHT_STEP,
    );

    lineHeightController.onChange((lineHeight: number) => {
      this._panel.setEventLogLineHeight(lineHeight);
    });

    // TODO needed ?
    // this._menuOptions[this._config.MENU_OPTIONS.EVENTS] = eventOptionValues;

    eventsFolder.close();
  }

  private addOptFullWin(): void {
    const option = this._config.MENU_OPTIONS.FULLWIN;
    this._menuOptions[option] = this._panel.isFullWin;
    this._gui
      .add(this._menuOptions, option)
      .name(option)
      .onChange((value: boolean) => {
        this._panel.setFullWin(value);
      });
  }

  private addFullscreenOption(): void {
    const option = this._config.MENU_OPTIONS.FULLSCREEN;
    this._menuOptions[option] = this._panel.isFullScreen;
    this._gui
      .add(this._menuOptions, option)
      .name(option)
      .onChange((value: boolean) => {
        this._panel.setFullScreen(value);
      });
  }

  show(): void {
    this._gui.show();
  }

  hide(): void {
    this._gui.hide();
  }

  destroy() {
    this._gui.close();
    this.removeMenuFromPanel();
    this._gui.destroy();
  }

  reset(): void {
    // we use this to update options when switching to/from fullscreen
    this.destroy();
    this.init(this._panel, this._config);
  }

  protected get config(): MenuConfig {
    return this._config;
  }

  protected get gui(): GUI {
    return this._gui;
  }

  protected get panel(): Panel {
    return this._panel;
  }

  protected get menuOptions(): MenuOptions {
    return this._menuOptions;
  }
}

export { MenuGui, MenuConfig };
