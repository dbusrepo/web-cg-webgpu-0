// eslint-disable-next-line import/no-nodejs-modules, unicorn/prefer-node-protocol
import assert from 'assert';
import { Pane as TweakPane, type InputBindingApi } from 'tweakpane';
// eslint-disable-next-line import/no-namespace
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import GUI from '../ui/guify/src/gui';
import { type Panel } from './panel';

enum EventLogVis {
  BELOW_CANVAS = 'below',
  OVER_CANVAS = 'over',
  INVISIBLE = 'invisible',
}

enum PanelTweakOptionsEnum {
  STATS_ENABLED = 'stats_enabled',
  EVENTS = 'events',
}

interface PanelTweakOptions {
  [PanelTweakOptionsEnum.STATS_ENABLED]: boolean;
  [PanelTweakOptionsEnum.EVENTS]: EventLogVis;
}

interface PanelGuiConfig {
  isTweakPaneExpanded: boolean;
}

abstract class PanelGui {
  protected abstract panel: Panel;
  protected abstract tweakOptions: PanelTweakOptions;
  protected tweakPane: TweakPane;
  private cfg: PanelGuiConfig;
  private topBar: GUI;
  private statsInput: InputBindingApi<unknown, boolean>;

  private static panelGuiList: PanelGui[] = [];

  init(panel: Panel): void {
    assert(panel, 'panel is null or undefined');

    if (!this.cfg) {
      this.cfg = {
        isTweakPaneExpanded: false, // start closed
      };
      PanelGui.panelGuiList.push(this);
    }

    this.panel = panel;

    if (!this.tweakPane) {
      this.initTweakPane();
    }

    this.topBar = new GUI({
      root: panel.menuGuiContainer,
      // root: panel.panelEl,
      title: panel.title,
      theme: 'dark', // dark, light, yorha, or theme object
      align: 'right', // left, right
      width: 250,
      barMode: panel.menuGuiBarMode, // none, overlay, above, offset, full
      // panelMode: 'inner',
      opacity: 1, // 0.95,
      open: false,
      toggleFullScreen: (): void => {
        this.panel.toggleFullscreen();
      },
      toggleFullWin: (): void => {
        this.panel.toggleFullWin();
      },
      toggleControls: (): void => {
        this.tweakPane.expanded = !this.tweakPane.expanded;
        this.cfg.isTweakPaneExpanded = this.tweakPane.expanded;
        this.panel.focus();
      },
    }); // as unknown as typeof Guify;
  }

  private initTweakPane(): void {
    const container = this.panel.CanvasContainer;
    this.tweakPane = new TweakPane({
      container,
      expanded: this.cfg.isTweakPaneExpanded,
    });
    this.tweakPane.registerPlugin(EssentialsPlugin);
    this.initTweakPaneStyle(container);
    // when (reinit) keep obj opts
    this.initTweakPaneOptionsObj();
    this.addTweakPaneOptions();
  }

  private initTweakPaneStyle(container: HTMLDivElement): void {
    this.tweakPane.element.style.position = 'absolute';
    this.tweakPane.element.style.borderRadius = '0px';
    this.tweakPane.element.style.top = '0px';
    this.tweakPane.element.style.right = '0px';
    this.tweakPane.element.style.overflow = 'scroll';
    this.tweakPane.element.style.zIndex = '999999';
    // tweakPane.controller_.view.buttonElement.disabled = true;
    // tweakPane.controller_.view.buttonElement.style.display = 'none';

    // to make overflow scroll work
    if (this.tweakPane.element.clientHeight > container.clientHeight) {
      this.tweakPane.element.style.height = `${container.clientHeight}px`;
    }
  }

  protected getEventLogVisState(): EventLogVis {
    if (this.panel.isEventLogVisible) {
      return this.panel.isEventLogBelowCanvas
        ? EventLogVis.BELOW_CANVAS
        : EventLogVis.OVER_CANVAS;
    }
    return EventLogVis.INVISIBLE;
  }

  protected initTweakPaneOptionsObj(): void {
    this.tweakOptions = {
      [PanelTweakOptionsEnum.STATS_ENABLED]: this.panel.isStatsVisible,
      [PanelTweakOptionsEnum.EVENTS]: this.getEventLogVisState(),
    };
  }

  protected abstract addTweakPaneOptions(): void;

  protected addStatsOpt(): void {
    const statsFolder = this.tweakPane.addFolder({
      title: 'Stats',
      expanded: false,
    });

    this.statsInput = statsFolder.addBinding(
      this.tweakOptions,
      PanelTweakOptionsEnum.STATS_ENABLED,
    ) as InputBindingApi<unknown, boolean>;

    this.statsInput.on('change', (ev) => {
      this.panel.setStatsVisible(ev.value);
      PanelGui.updateStatsOptPanels(this);
    });

    const btn = statsFolder.addButton({
      title: 'Move top-left',
      // label: '',   // optional
    });

    btn.on('click', () => {
      this.panel.Stats.setPos(0, 0);
    });
  }

  protected addEventLogOpt(): void {
    const eventsFolder = this.tweakPane.addFolder({
      title: 'Events',
      expanded: false,
    });

    const eventLogPosInput = eventsFolder.addBinding(
      this.tweakOptions,
      PanelTweakOptionsEnum.EVENTS,
      {
        options: {
          below: EventLogVis.BELOW_CANVAS,
          over: EventLogVis.OVER_CANVAS,
          invisible: EventLogVis.INVISIBLE,
        },
      },
    );

    eventLogPosInput.on('change', (ev) => {
      switch (ev.value) {
        case EventLogVis.BELOW_CANVAS: {
          this.panel.setEventLogBelowCanvas();
          this.panel.setEventLogVisibility(true);
          break;
        }
        case EventLogVis.OVER_CANVAS: {
          this.panel.setEventLogOnCanvas();
          this.panel.setEventLogVisibility(true);
          break;
        }
        case EventLogVis.INVISIBLE: {
          this.panel.setEventLogVisibility(false);
          break;
        }
        default: {
          assert(false, 'unknown event log vis state');
        }
      }
    });
  }

  public static updateStatsOptPanels(sourcePanelGui: PanelGui): void {
    for (const panelGui of PanelGui.panelGuiList) {
      if (panelGui !== sourcePanelGui) {
        panelGui.tweakOptions[PanelTweakOptionsEnum.STATS_ENABLED] =
          sourcePanelGui.tweakOptions[PanelTweakOptionsEnum.STATS_ENABLED];
        // panelGui._tweakPane.refresh();
        panelGui.statsInput.refresh();
      }
    }
  }

  // private getDom(): HTMLElement {
  //   return this._gui.domElement;
  // }

  // private initPanel(): void {
  //   if (this._panel.panel !== this.getDom().parentNode) {
  //     this._panel.panel.appendChild(this.getDom());
  //   }
  //   this.setOnTop();
  // }

  // private setOnTop(): void {
  //   const parent = this._panel.canvasContainer;
  //   this.gui.domElement.style.zIndex = String(Number(parent.style.zIndex) + 1);
  // }

  // private removeMenuFromPanel(): void {
  //   this._panel.panel.removeChild(this.getDom());
  // }

  // protected addPanelOptions() {
  //   // TODO set params from config
  //   const PARAMS = {
  //     level: 0,
  //     name: 'Sketch',
  //     active: true,
  //   };
  //   this._tweakPane.addInput(PARAMS, 'level');
  //   this._tweakPane.addInput(PARAMS, 'name');
  //   this._tweakPane.addInput(PARAMS, 'active');
  // }

  // private initConsoleOptions(): void {
  //   if (!this._panel.console) {
  //     return;
  //   }

  //   const consoleFolder = this._gui.addFolder(
  //     this._config.MENU_OPTIONS.CONSOLE,
  //   );

  //   const consoleOptionValues = {
  //     // event controllers default values here
  //     [this._config.CONSOLE_OPTIONS.FONT_SIZE]: this._config.DEFAULT_FONT_SIZE,
  //     [this._config.CONSOLE_OPTIONS.LINE_HEIGHT]:
  //       this._config.DEFAULT_LINE_HEIGHT,
  //   };

  //   const fontSizeController = consoleFolder.add(
  //     consoleOptionValues,
  //     this._config.CONSOLE_OPTIONS.FONT_SIZE,
  //     this._config.MIN_FONT_SIZE,
  //     this._config.MAX_FONT_SIZE,
  //     this._config.FONT_SIZE_STEP,
  //   );

  //   fontSizeController.onChange((fontSize: number) => {
  //     this._panel.setConsoleFontSize(fontSize);
  //   });

  //   const lineHeightController = consoleFolder.add(
  //     consoleOptionValues,
  //     this._config.CONSOLE_OPTIONS.LINE_HEIGHT,
  //     this._config.MIN_LINE_HEIGHT,
  //     this._config.MAX_LINE_HEIGHT,
  //     this._config.LINE_HEIGHT_STEP,
  //   );

  //   lineHeightController.onChange((lineHeight: number) => {
  //     this._panel.setConsoleLineHeight(lineHeight);
  //   });

  //   consoleFolder.close();
  // }

  // private addEventLogFolderOptions(): void {
  //   if (!this._panel.eventLog) {
  //     return;
  //   }

  //   const eventsFolder = this._gui.addFolder(this._config.MENU_OPTIONS.EVENTS);

  //   const eventLogStartModeValue = this._panel.isEventLogBelowCanvas
  //     ? this._config.EVENT_LOG_POSITION_VALUES.BOTTOM
  //     : this._config.EVENT_LOG_POSITION_VALUES.PANEL;

  //   const _isEventLogVisible = this._panel.isEventLogVisible;

  //   const eventOptionValues = {
  //     // event controllers default values here
  //     [this._config.EVENT_LOG_OPTIONS.POSITION]: eventLogStartModeValue,
  //     [this._config.EVENT_LOG_OPTIONS.FONT_SIZE]:
  //       this._config.DEFAULT_FONT_SIZE,
  //     [this._config.EVENT_LOG_OPTIONS.LINE_HEIGHT]:
  //       this._config.DEFAULT_LINE_HEIGHT,
  //     [this._config.EVENT_LOG_OPTIONS.VISIBLE]: _isEventLogVisible,
  //   };

  //   const logPositions = [
  //     this._config.EVENT_LOG_POSITION_VALUES.BOTTOM,
  //     this._config.EVENT_LOG_POSITION_VALUES.PANEL,
  //   ];

  //   const eventLogVisController = eventsFolder.add(
  //     eventOptionValues,
  //     this._config.EVENT_LOG_OPTIONS.VISIBLE,
  //   );

  //   eventLogVisController.onChange((value: boolean) => {
  //     this._panel.setEventLogVisibility(value);
  //   });

  //   eventsFolder
  //     .add(
  //       eventOptionValues,
  //       this._config.EVENT_LOG_OPTIONS.POSITION,
  //       logPositions,
  //     )
  //     .onChange((position) => {
  //       switch (position) {
  //         case this._config.EVENT_LOG_POSITION_VALUES.BOTTOM:
  //           if (!this._panel.isEventLogBelowCanvas) {
  //             this._panel.setEventLogBelowCanvas();
  //           }
  //           break;
  //         case this._config.EVENT_LOG_POSITION_VALUES.PANEL:
  //           if (this._panel.isEventLogBelowCanvas) {
  //             this._panel.setEventLogOnCanvas();
  //           }
  //           break;
  //         default:
  //           break;
  //       }
  //     });

  //   const fontSizeController = eventsFolder.add(
  //     eventOptionValues,
  //     this._config.EVENT_LOG_OPTIONS.FONT_SIZE,
  //     this._config.MIN_FONT_SIZE,
  //     this._config.MAX_FONT_SIZE,
  //     this._config.FONT_SIZE_STEP,
  //   );

  //   fontSizeController.onChange((fontSize: number) => {
  //     this._panel.setEventLogFontSize(fontSize);
  //   });

  //   const lineHeightController = eventsFolder.add(
  //     eventOptionValues,
  //     this._config.EVENT_LOG_OPTIONS.LINE_HEIGHT,
  //     this._config.MIN_LINE_HEIGHT,
  //     this._config.MAX_LINE_HEIGHT,
  //     this._config.LINE_HEIGHT_STEP,
  //   );

  //   lineHeightController.onChange((lineHeight: number) => {
  //     this._panel.setEventLogLineHeight(lineHeight);
  //   });

  //   // TODO needed ?
  //   // this._menuOptions[this._config.MENU_OPTIONS.EVENTS] = eventOptionValues;

  //   eventsFolder.close();
  // }

  // private addOptFullWin(): void {
  //   const option = this._config.MENU_OPTIONS.FULLWIN;
  //   this._menuOptions[option] = this._panel.isFullWin;
  //   this._gui
  //     .add(this._menuOptions, option)
  //     .name(option)
  //     .onChange((value: boolean) => {
  //       this._panel.setFullWin(value);
  //     });
  // }

  // TODO remove
  // private addFullscreenOption(): void {
  //   const option = this._config.MENU_OPTIONS.FULLSCREEN;
  //   this._menuOptions[option] = this._panel.isFullScreen;
  //   this._gui
  //     .add(this._menuOptions, option)
  //     .name(option)
  //     .onChange((value: boolean) => {
  //       this._panel.setFullScreen(value);
  //     });
  // }

  // show() {
  //   // this._gui.show();
  // }

  // hide() {
  //   // this._gui.hide();
  // }

  // destroy() {
  //   // this._gui.close();
  //   // this.removeMenuFromPanel();
  //   // this._gui.destroy();
  // }

  // protected get menuOptions(): PanelTweakOptions {
  //   return this._tweakPaneOptions;
  // }

  // protected get panel(): Panel {
  //   return this._panel;
  // }

  removefromDom(): void {
    this.topBar.removefromDom();
    // this._tweakPane.dispose();
  }
}

export { PanelGui };
export type { PanelTweakOptions };
