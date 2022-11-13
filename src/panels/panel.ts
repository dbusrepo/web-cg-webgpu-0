import assert from 'assert';
import screenfull from 'screenfull';
import {
  StartViewMode,
  PanelConfig,
  EventLogConfig,
  ConsoleConfig,
} from '../config/config';
import { Console, ConsoleHandlersObjInit } from '../ui/console/console';
import { MenuGui } from './menuGui';
import { EventLog } from '../ui/eventLog/eventLog';

// TODO move?
const resetClassName = (node: HTMLElement) => {
  node.className = ''; // empty the list
};

// fullscreen api can only be initiated only initiated by a user gesture, so we
// have StartViewMode vs ViewMode
const enum ViewMode {
  WIN = 'win',
  FULL_WIN = 'fullwin',
  FULL_SCREEN = 'fullscreen',
}

abstract class Panel {
  private static _panels: Panel[] = [];

  private _config: PanelConfig;

  private _board: HTMLDivElement; // used to append the panel in full win/screen
  private _parentNode: HTMLDivElement;

  private _panelContainer: HTMLDivElement;
  private _panel: HTMLDivElement;

  private _onPanelFocus: (event: FocusEvent) => void;
  private _onPanelKeyDown: (e: KeyboardEvent) => void;

  private _canvasContainer: HTMLDivElement;
  private _canvas: HTMLCanvasElement;

  // perc wrt to panel container when in full win/screen to allow the vis of
  // event log below
  private _canvasDisplayHeightPercFull: number; // TODO check use

  // note: the event log can be rendered on the main panel or on a separate own
  // panel when in full (win) mode the event log uses _eventLogMainContainer
  // inside the

  // canvas container and the log is displayed inside the main panel: it can be
  // displayed in the main panel (in place of canvas) or in a bottom part under
  // the canvas
  // when in win mode it uses its own panel _eventLogContainer which is
  // displayed always under the main panel container

  private _eventLog?: EventLog;
  private _eventLogBottomPanel?: HTMLDivElement;
  private _eventLogMainPanel?: HTMLDivElement;

  private _console?: Console;

  protected _menuGui?: MenuGui;
  // used with console cmd handler. not used for now.

  protected _viewMode: ViewMode;
  protected _preViewMode: ViewMode;

  constructor(board: HTMLDivElement, parentNode: HTMLDivElement) {
    this._board = board;
    this._parentNode = parentNode;
  }

  init(panelConfig: PanelConfig) {
    this._config = structuredClone(panelConfig);
    this.initPanel();
    this.initCanvas();
    this.initEventLog();
    this.initConsole();
    this.initFullScreenMode();
    Panel._panels.push(this);
  }

  private initPanel(): void {
    this._panelContainer = document.createElement('div');
    this._panelContainer.classList.add('panel-container');
    this._panel = document.createElement('div');
    this._panel.tabIndex = -1; // TODO call this before focus() !
    // this._panelContainer.appendChild(this._panel); // done before run
    this._parentNode.appendChild(this._panelContainer);
    this.addListeners();
  }

  private setPanelWinStyle(): void {
    resetClassName(this._panel);
    this._panel.classList.add('panel', 'panel-win');
    if (!(this.isInit() || this._preViewMode === ViewMode.WIN)) {
      this.showAllPanels();
    }
  }

  private setPanelFullStyle(): void {
    resetClassName(this._panel);
    this._panel.classList.add('panel', 'panel-full');
    this.hideOtherPanels();
  }

  private setViewMode(viewMode: ViewMode): void {
    this._preViewMode = this._viewMode;
    this._viewMode = viewMode;
  }

  private canStartInFullWin(): boolean {
    // if a previous panel is already in full win, return false....
    for (const panel of Panel.getPanelList()) {
      if (panel === this) {
        break;
      }
      if (panel.isFullWin) {
        return false;
      }
    }
    return true;
  }

  private initFullWinMode(): void {
    if (this._config.startViewMode === StartViewMode.FULL_WIN) {
      if (this.canStartInFullWin()) {
        this.setFullWin(true);
      } else {
        this._config.startViewMode = StartViewMode.WIN;
        this.initWinMode();
      }
    }
  }

  // toggle win - fullwin
  public setFullWin(enable: boolean): void {
    assert(!this.isFullScreen);
    if (enable) {
      this.setViewMode(ViewMode.FULL_WIN);
      this.toFullWinStyle();
    } else {
      this.setViewMode(ViewMode.WIN);
      this.toWinStyle();
    }
    if (!this.isInit()) {
      this.getFocus();
    }
  }

  // fullscreen mode can be entered only by a gesture, so we init only here
  private initFullScreenMode(): void {
    if (screenfull.isEnabled) {
      screenfull.on('change', () => {
        // handled here only the case when the user presses ESC to exit from FS
        // which is not detected 'cauz Escape is not detected as a keydown
        // event...
        if (this.isFullScreen && !screenfull.isFullscreen) {
          this.resetModeAfterFullScreen();
        }
      });
    } else {
      console.error('Fullscreen not supported');
      return;
    }
    screenfull.onerror((event) => {
      console.error('screenfull error', event);
    });
  }

  public async setFullScreen(enable: boolean): Promise<void> {
    if (!screenfull.isEnabled) {
      console.error('Fullscreen not allowed!');
      return;
    }
    if (enable) {
      await screenfull.request(this.panel, { navigationUI: 'hide' });
      this.enableFullScreenMode();
      this._menuGui?.reset();
    } else {
      await screenfull.exit();
      this.resetModeAfterFullScreen();
    }
  }

  private enableFullScreenMode(): void {
    this.setViewMode(ViewMode.FULL_SCREEN);
    if (this._preViewMode === ViewMode.WIN) {
      this.setFullStyle();
    }
  }

  private resetModeAfterFullScreen() {
    assert(
      this._viewMode === ViewMode.FULL_SCREEN &&
        (this._preViewMode === ViewMode.WIN ||
          this._preViewMode === ViewMode.FULL_WIN),
    );
    this.setViewMode(this._preViewMode);
    if (this.isWinMode) {
      this.toWinStyle();
    } else {
      this.toFullWinStyle();
    }
    if (!this.isInit()) {
      this.getFocus();
    }
  }

  private addListeners(): void {
    this.initKeyHandlers();
    this._onPanelFocus = (event: FocusEvent) => {
      this._canvasContainer.focus();
    };
    this._panel.addEventListener('focus', this._onPanelFocus);
  }

  protected initKeyHandlers(): void {
    this._onPanelKeyDown = (e: KeyboardEvent) => {
      // console.log('panel onKeyDown')
      // switch (e.key) {
      //   case Panel.FULL_WIN_KEY:
      //     // this.toggleFullWin(); // disable for now TODO
      //     break;
      //   case Panel.FULL_SCREEN_KEY:
      //     // this.toggleFullScreen(); // disable for now TODO
      //     break;
      //   // case 'F3':
      //   case 'Escape': // TODO
      //     // when in FS esc exit from FS, but note this handler here is not
      //     // executed !
      //     break;
      //   // case Panel.CONSOLE_KEY:
      //   //   console.log('panel console key detected');
      //   //   break;
      //   default:
      //     break;
      // }
      // if (!this._isConsoleOpen && e.key !== Panel.CONSOLE_KEY) {
      //   console.log('block console key');
      //   // if console key, let console handle it
      //   // otherwise stop event prop during capturing phase
      //   // rem: top down, on the bottom there is the console container
      //   e.stopPropagation();
      // }
    };
    // last arg true to capture events from top
    this._panel.addEventListener('keydown', this._onPanelKeyDown, true);
  }

  private initCanvas(): void {
    this._canvasContainer = document.createElement('div');
    this._canvas = document.createElement('canvas');
    this._canvas.width = Number(this.config.canvasWidth);
    this._canvas.height = Number(this.config.canvasHeight);
    // other init elements could change canvas props (event log?) so we start
    // hidden
    // this._panelContainer.appendChild(this._canvas);
    this._canvasContainer.appendChild(this._canvas);
    this._canvasContainer.tabIndex = -1; // make it focusable
    this._panel.appendChild(this._canvasContainer);
  }

  private setCanvasWinStyle(): void {
    resetClassName(this._canvas);
    this._canvas.classList.add('canvas', 'canvas-win');
    this._canvas.style.width = `${this._config.canvasDisplayWidthWinMode}px`;
    this._canvas.style.height = `${this._config.canvasDisplayHeightWinMode}px`;
    resetClassName(this._canvasContainer);
    this._canvasContainer.classList.add(
      'canvas-container',
      'canvas-container-win',
    );
    this._canvasContainer.style.height = `${Number(
      this.config.canvasDisplayHeightWinMode,
    )}px`;
  }

  private setCanvasFullStyle(): void {
    assert(!this.isWinMode);
    resetClassName(this._canvas);
    this._canvas.classList.add('canvas', 'canvas-full');
    this._canvas.style.width = '100%'; // TODO remove? already set by css...
    this._canvas.style.height = '100%';
    resetClassName(this._canvasContainer);
    this._canvasContainer.classList.add(
      'canvas-container',
      'canvas-container-full',
    );
    this.updateCanvasContainerHeightFullMode();
  }

  private initEventLog(): void {
    if (!this.config.enableEventLog) {
      return;
    }
    this._eventLogMainPanel = document.createElement('div');
    this._eventLogMainPanel.classList.add('event-log-main-panel');
    this._eventLogBottomPanel = document.createElement('div');
    this.moveOutEventLogBottomPanel();
    this.moveOutEventLogMainPanel();
    let eventContainer;
    if (this.isEventLogBelowCanvas) {
      // this.showEventLogOnBottomPanel(true);
      eventContainer = this._eventLogBottomPanel;
    } else {
      // this.showEventLogOnMainPanel(true);
      eventContainer = this._eventLogMainPanel;
    }
    const eventLogConfig: EventLogConfig = {
      ...this._config.eventLogConfig,
      fontSize: this._config.menuConfig.DEFAULT_FONT_SIZE,
      lineHeight: this._config.menuConfig.DEFAULT_LINE_HEIGHT,
    };
    const eventHandlers = {};
    this._eventLog = new EventLog(
      eventContainer,
      eventLogConfig,
      eventHandlers,
    );
  }

  protected initConsole(): void {
    if (!this.config.enableConsole) {
      return;
    }
    const consoleConfig: ConsoleConfig = {
      ...this._config.consoleConfig,
      welcome: 'Hello User',
      caseSensitive: true,
      autoComplete: true,
      onOpening: () => {
        this.onConsoleOpening();
      },
      onClosing: () => {
        this.onConsoleClosing();
      },
      onOpened: () => {
        this.onConsoleOpened();
      },
      onClosed: () => {
        this.onConsoleHidden();
      },
      prompt: this.config.consoleConfig.prompt,
      fontSize: this._config.menuConfig.DEFAULT_FONT_SIZE,
      lineHeight: this._config.menuConfig.DEFAULT_LINE_HEIGHT,
    };
    const consoleHandlers = this.buildConsoleHandlers();
    this._console = new Console(
      this._canvasContainer,
      consoleConfig,
      consoleHandlers,
    );
    // this.container.addEventListener('focus', () => {
    //   assert(this.consoleContainer);
    //   this.consoleContainer.focus();
    // });
  }

  // TODO refactor ?
  protected buildConsoleHandlers(): ConsoleHandlersObjInit {
    const clear = () => {
      this._console!.clear();
    };
    const defaultHandler = () => 'Unrecognized command';
    defaultHandler.isDefault = true;
    return {
      // showMenu,
      // hideMenu,
      clear,
      defaultHandler,
    };
  }

  protected onConsoleOpening(): void {
    // this.add_key_listener();
    this.isConsoleOpen = true;
    // if (this.menuGui) {
    //   this.menuGui.hide();
    // }
  }

  protected onConsoleOpened(): void {}

  protected onConsoleClosing(): void {
    // if (this.menuGui) {
    //   this.menuGui.show();
    // }
  }

  protected onConsoleHidden(): void {
    // called after transitionEnd, see console panel impl
    // this.add_key_listener();
    this.isConsoleOpen = false;
    this.getFocus(); // give focus to panel
  }

  getFocus(): void {
    // console.trace();
    this._panel.focus(); // onFocus called
  }

  private showAllPanels(): void {
    for (const panel of Panel.getPanelList()) {
      panel._panelContainer.style.display = 'block';
      // force all panels to win mode
      panel.setViewMode(ViewMode.WIN);
      panel.toWinStyle();
    }
  }

  private hideOtherPanels(): void {
    for (const panel of Panel.getPanelList()) {
      if (panel !== this) {
        panel._panelContainer.style.display = 'none';
      }
    }
  }

  // used to check some event log invariants
  private eventLogCheckInv(): void {
    // TODO remove/debug mode only?
    // console.log('inv');
    if (this.isEventLogVisible) {
      if (this.isEventLogBelowCanvas) {
        assert(this._panel.lastChild === this._eventLogBottomPanel);
      } else {
        assert(this._panelContainer.lastChild === this._eventLogBottomPanel);
      }
    } else {
      assert(this._panelContainer.lastChild === this._eventLogBottomPanel);
    }
  }

  private isPanelInsideParentContainer(): boolean {
    return this._panel.parentNode === this._panelContainer;
  }

  private appendPanelTo(element: HTMLDivElement): void {
    this._panel.parentNode?.removeChild(this._panel);
    element.appendChild(this._panel);
  }

  private toWinStyle(): void {
    assert(this.isWinMode);
    if (!this.isPanelInsideParentContainer()) {
      this.appendPanelTo(this._panelContainer);
    }
    this.setWinStyle();
    this._menuGui?.reset();
    assert(this.isPanelInsideParentContainer());
  }

  protected setWinStyle(): void {
    this.setPanelWinStyle();
    this.setCanvasWinStyle();
    this._console?.setOnWinMode();
    if (this._eventLog) {
      this.setEventLogBottomPanelWinStyle();
      this.moveEventLogBottomPanelOutOfPanel();
      this.setEventLogVisibility(this.isEventLogVisible);
      // if (this.isEventLogVisible) {
      //   this._eventLog.render(true); // TODO check double render ?
      //   if (!this.isEventLogOnBottomPanel) {
      //     this.moveEventLogAfterPanel();
      //   }
      // } else {
      //   this.moveEventLogAfterPanel();
      // }
      this.eventLogCheckInv();
    }
  }

  private initWinMode(): void {
    if (this._config.startViewMode === StartViewMode.WIN) {
      this.setViewMode(ViewMode.WIN);
      this.toWinStyle();
    }
  }

  private isInit(): boolean {
    return this._preViewMode === undefined;
  }

  private toFullWinStyle(): void {
    assert(this.isFullWin);
    if (this.isInit() || this._preViewMode === ViewMode.WIN) {
      assert(this.isInit() || this.isPanelInsideParentContainer());
      this.appendPanelTo(this._board);
      this.setEventLogVisibility(this.isEventLogVisible);
      this.setFullStyle();
    }
    this._menuGui?.reset();
    assert(this._panel.parentNode === this._board);
  }

  protected setFullStyle(): void {
    this.setPanelFullStyle();
    this.setCanvasFullStyle();
    this._console?.setOnFullMode(); // TODO check from here...
    if (this._eventLog) {
      this.setEventLogBottomPanelFullStyle(); // TODO not necessary?
      this._eventLog.render(true);
    }
  }

  private setEventLogBottomPanelWinStyle(): void {
    assert(this._eventLogBottomPanel);
    assert(this._eventLog);
    resetClassName(this._eventLogBottomPanel);
    this._eventLogBottomPanel.classList.add(
      'event-log-bottom-panel',
      'event-log-bottom-panel-win',
    );
    // width alread 100% see css
    this._eventLogBottomPanel.style.height = `${
      this.config.eventLogConfig.percHeightWin *
      this._config.canvasDisplayHeightWinMode
    }px`; // height in px here
  }

  private setEventLogBottomPanelFullStyle(): void {
    assert(this._eventLogBottomPanel);
    assert(this._eventLog);
    resetClassName(this._eventLogBottomPanel);
    this._eventLogBottomPanel.classList.add(
      'event-log-bottom-panel',
      'event-log-bottom-panel-full-win',
    );
    this.updateEventLogBottomPanelHeightPercFullMode(); // TODO not nec
  }

  // Note: the events log can be showed on his own panel (below the canvas)
  // or the same area of canvas (the canvas is hidden in that case). The two are
  // complementary states

  private moveEventLogBottomPanelInsidePanel(): void {
    assert(this._eventLogBottomPanel);
    this._eventLogBottomPanel.parentNode?.removeChild(
      this._eventLogBottomPanel,
    );
    // pushed as last el
    this._panel.appendChild(this._eventLogBottomPanel);
  }

  private moveEventLogBottomPanelOutOfPanel(): void {
    const eventLogBottomPanel = this._eventLogBottomPanel!;
    eventLogBottomPanel.parentNode?.removeChild(eventLogBottomPanel);
    // we move the log below the panel to keep the same height with main
    // container and the canvas otherwise without the event panel below the
    // canvas would be recentered...
    this._panelContainer.appendChild(eventLogBottomPanel);
  }

  private moveOutEventLogBottomPanel(): void {
    assert(this._eventLogBottomPanel);
    this._eventLogBottomPanel!.style.visibility = 'hidden';
    this.moveEventLogBottomPanelOutOfPanel();
    if (!this.isWinMode) {
      this.updateCanvasContainerHeightFullMode();
    }
  }

  // private hideEventsLogMainPanel(showOnBottomPanel: boolean): void {
  private moveOutEventLogMainPanel(): void {
    assert(this._eventLogMainPanel);
    // assert(!this.isEventLogOnBottomPanel);
    // this.isEventLogOnBottomPanel = showOnBottomPanel;
    // this._eventLogMainPanel.style.visibility = 'hidden';
    this._eventLogMainPanel.style.visibility = 'hidden';
    this._canvas.style.visibility = 'visible'; // display block/none ?
    this._eventLogMainPanel.parentNode?.removeChild(this._eventLogMainPanel);
  }

  private moveInEventLogBottomPanel(): void {
    assert(this._eventLog);
    assert(this._eventLogBottomPanel);
    assert(this.isEventLogBelowCanvas);
    assert(this.isEventLogVisible);
    this.moveEventLogBottomPanelInsidePanel();
    this._eventLogBottomPanel.style.visibility = 'visible';
    if (!this.isWinMode) {
      this.updateCanvasContainerHeightFullMode();
      this.updateEventLogBottomPanelHeightPercFullMode();
    }
    this._eventLog.setContainer(this._eventLogBottomPanel);
    this.eventLogCheckInv();
  }

  private moveInEventLogMainPanel(): void {
    assert(this._eventLog);
    assert(this._eventLogMainPanel);
    assert(!this.isEventLogBelowCanvas);
    assert(this.isEventLogVisible);
    this._canvas.style.visibility = 'hidden';
    this._eventLogMainPanel.style.visibility = 'visible';
    this._canvasContainer.appendChild(this._eventLogMainPanel);
    this._eventLog.setContainer(this._eventLogMainPanel);
    this.eventLogCheckInv();
  }

  public setEventLogBelowCanvas(): void {
    this.isEventLogBelowCanvas = true;
    if (this.isEventLogVisible) {
      this.moveOutEventLogMainPanel();
      this.moveInEventLogBottomPanel();
    }
  }

  public setEventLogOnCanvas(): void {
    this.isEventLogBelowCanvas = false;
    if (this.isEventLogVisible) {
      this.moveOutEventLogBottomPanel();
      this.moveInEventLogMainPanel();
    }
  }

  private updateCanvasContainerHeightFullMode(): void {
    this._canvasDisplayHeightPercFull = 1;
    if (this.isEventLogVisible && this.isEventLogBelowCanvas) {
      this._canvasDisplayHeightPercFull =
        1 - this.config.eventLogConfig.percHeightFull;
    }
    // set the css value for the canvas container
    this._canvasContainer.style.height = `${
      this._canvasDisplayHeightPercFull * 100
    }%`;
  }

  private updateEventLogBottomPanelHeightPercFullMode(): void {
    assert(this._eventLogBottomPanel);
    this._eventLogBottomPanel.style.height = `${
      (1 - this._canvasDisplayHeightPercFull) * 100
    }%`;
  }

  setEventLogVisibility(visible: boolean): void {
    this.isEventLogVisible = visible;
    if (this.isEventLogBelowCanvas) {
      if (visible) {
        this.moveInEventLogBottomPanel();
      } else {
        this.moveOutEventLogBottomPanel();
      }
    } else if (visible) {
      this.moveInEventLogMainPanel();
    } else {
      this.moveOutEventLogMainPanel();
    }
    this.eventLogCheckInv();
  }

  setEventLogFontSize(fontSize: number): void {
    assert(this._eventLog);
    this._eventLog.setFontSize(fontSize);
  }

  setEventLogLineHeight(lineHeight: number): void {
    assert(this._eventLog);
    this._eventLog.setLineHeight(lineHeight);
  }

  setConsoleFontSize(fontSize: number): void {
    assert(this._console);
    this._console.setFontSize(fontSize);
  }

  setConsoleLineHeight(lineHeight: number): void {
    assert(this._eventLog);
    this._console?.setLineHeight(lineHeight);
  }

  protected initMenuGui(): void {
    if (!this.config.enableMenuGui) {
      return;
    }
    this._menuGui = new MenuGui();
    this._menuGui.init(this, { ...this.config.menuConfig });
  }

  private initFocus(): void {
    // if a previous panel has starting focus, ignore start focus for this
    let panel;
    for (panel of Panel.getPanelList()) {
      if (panel === this || panel._config.focusOnStart) {
        break;
      }
    }
    if (panel === this && this._config.focusOnStart) {
      this.getFocus();
    }
  }

  protected initPreRun(): void {}

  run(): void {
    this.initWinMode();
    this.initFullWinMode();
    this.initPreRun(); // before menu gui !
    this.initMenuGui(); // should be called as last
    this.initFocus();
  }

  protected destroy() {
    this._menuGui?.destroy();
  }

  get isWinMode(): boolean {
    return this._viewMode === ViewMode.WIN;
  }

  get canvasContainer(): HTMLDivElement {
    return this._canvasContainer;
  }

  get panel(): HTMLDivElement {
    return this._panel;
  }

  get board(): HTMLDivElement {
    return this._board;
  }

  get isFullWin(): boolean {
    return this._viewMode === ViewMode.FULL_WIN;
  }

  get isFullScreen(): boolean {
    return this._viewMode === ViewMode.FULL_SCREEN;
  }

  get name(): string {
    return this.config.name;
  }

  get config(): PanelConfig {
    return this._config;
  }

  get console(): Console | null {
    return this._console ?? null;
  }

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  get menuGui(): MenuGui | null {
    return this._menuGui ?? null;
  }

  protected set menuGui(menuGui: MenuGui | null) {
    this._menuGui = menuGui ?? undefined;
  }

  get eventLog(): EventLog | null {
    return this._eventLog ?? null;
  }

  static getPanelList(): Panel[] {
    return Panel._panels;
  }

  get isEventLogVisible(): boolean {
    return this._config.eventLogConfig.isVisible;
  }

  set isEventLogVisible(value: boolean) {
    this._config.eventLogConfig.isVisible = value;
  }

  get isConsoleOpen(): boolean {
    return this._config.consoleConfig.isOpen;
  }

  set isConsoleOpen(value: boolean) {
    this._config.consoleConfig.isOpen = value;
  }

  get isEventLogBelowCanvas(): boolean {
    return this._config.eventLogConfig.showBelowCanvas;
  }

  set isEventLogBelowCanvas(value: boolean) {
    this._config.eventLogConfig.showBelowCanvas = value;
  }
}

export { Panel, ViewMode };
