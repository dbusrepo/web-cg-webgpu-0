import assert from 'assert';
import screenfull from 'screenfull';
import {
  StartViewMode,
  PanelConfig,
  EventLogConfig,
  ConsoleConfig,
} from '../config/mainConfig';
import { Console, ConsoleHandlersObjInit } from '../ui/console/console';
import { PanelGui } from './panelGui';
import { EventLog } from '../ui/eventLog/eventLog';
import { Stats } from '../ui/stats/stats';

// TODO move?
const resetClassName = (node: HTMLElement) => {
  node.className = ''; // empty the list
};

// fullscreen api can only be initiated by a user gesture
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

  private _panelContainerWinFull: HTMLDivElement;
  // eslint-disable-next-line max-len
  private _panelContainerWinFullHeight: number; // cached to avoid fs -> fw errors

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

  protected _menuGui?: PanelGui;
  // used with console cmd handler. not used for now.

  protected _stats: Stats;

  protected _viewMode: ViewMode;
  protected _preViewMode: ViewMode;

  constructor(board: HTMLDivElement, parentNode: HTMLDivElement) {
    this._board = board;
    this._parentNode = parentNode;
  }

  init(panelConfig: PanelConfig, stats: Stats) {
    this._config = structuredClone(panelConfig);
    this._stats = stats;
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
    this._panelContainerWinFull = document.createElement('div');
    this._panelContainerWinFull.classList.add('panel-container-win-full');
    this._board.appendChild(this._panelContainerWinFull); // TODO in init
    this._panelContainerWinFullHeight =
      this._panelContainerWinFull.offsetHeight;
    this._panel = document.createElement('div');
    this._panel.tabIndex = -1; // TODO call this before focus() !
    // this._panelContainer.appendChild(this._panel); // done before run
    this._parentNode.appendChild(this._panelContainer);
    this.addListeners();
  }

  private setPanelWinStyle(): void {
    resetClassName(this._panel);
    this._panel.classList.add('panel', 'panel-win');
    this._panelContainer.style.marginTop = '0';
    this._panel.style.marginTop = '0';
    this._panel.style.width = `auto`;
    this._panel.style.height = `auto`;
    if (!(this.isInit() || this._preViewMode === ViewMode.WIN)) {
      this.setAllPanelsToWinMode();
    }
  }

  private setPanelFullStyle(): void {
    assert(
      this.isFullScreen ||
        this._panel.parentNode === this._panelContainerWinFull,
    );
    resetClassName(this._panel);
    this._panel.classList.add('panel', 'panel-full');
    const menuBarHeight = 25; // see guify guify theme.js
    this._panel.style.marginTop = `${menuBarHeight}px`;
    const panelFullHeight = this.isFullScreen
      ? screen.height
      : this._panelContainerWinFullHeight;
    this._panel.style.height = `${panelFullHeight - 25}px`;
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
        return true;
      }
      if (panel.isFullWin) {
        return false;
      }
    }
    return false;
  }

  private initFullWinMode(): void {
    // console.log('start view mode: ' + this._config.startViewMode);
    if (this._config.startViewMode === StartViewMode.FULL_WIN) {
      // console.log('Can start in fw: ' + this.canStartInFullWin());
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
    if (enable) {
      this.setViewMode(ViewMode.FULL_WIN);
      this.toFullWinStyle();
    } else {
      this.setViewMode(ViewMode.WIN);
      this.toWinStyle();
    }
    if (!this.isInit()) {
      this.focus();
    }
  }

  // fullscreen mode can be entered only by a gesture, so we init only here
  private initFullScreenMode(): void {
    if (screenfull.isEnabled) {
      screenfull.on('change', () => {
        // handle here the case when the user presses ESC to exit from FS mode
        // because the Escape key is not detected as a keydown event...
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
      this.enableFullScreenMode();
      await screenfull.request(this._panelContainer, { navigationUI: 'hide' });
    } else {
      assert(screenfull.isFullscreen);
      await screenfull.exit();
      this.resetModeAfterFullScreen();
    }
  }

  private enableFullScreenMode(): void {
    // if in full win go to win mode first and then to fullscreen
    if (this._viewMode === ViewMode.FULL_WIN) {
      this.setFullWin(false);
      // eslint-disable-next-line max-len
      // to have preViewMode set to fullwin with setViewMode(ViewMode.FULL_SCREEN)
      this._viewMode = ViewMode.FULL_WIN;
    }
    this.setViewMode(ViewMode.FULL_SCREEN);
    this.resetGui();
    this.setFullStyle();
  }

  private resetModeAfterFullScreen() {
    assert(
      this._viewMode === ViewMode.FULL_SCREEN &&
        (this._preViewMode === ViewMode.WIN ||
          this._preViewMode === ViewMode.FULL_WIN),
    );
    const fromFullWin = this._preViewMode === ViewMode.FULL_WIN;
    this.setFullWin(false);
    if (fromFullWin) {
      this.setFullWin(true);
    }
  }

  private addListeners(): void {
    this.initKeyHandlers();
    const onPanelFocus = (event: FocusEvent) => {
      this._canvasContainer.focus();
    };
    this._panel.addEventListener('focus', onPanelFocus);
  }

  protected initKeyHandlers(): void {
    const onPanelKeyDown = (e: KeyboardEvent) => {
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
    this._panel.addEventListener('keydown', onPanelKeyDown, true);
  }

  private initCanvas(): void {
    this._canvasContainer = document.createElement('div');
    this._canvas = document.createElement('canvas');
    this._canvas.width = Number(this._config.canvasWidth);
    this._canvas.height = Number(this._config.canvasHeight);
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
    this._canvasContainer.style.width = `${this._config.canvasDisplayWidthWinMode}px`;
    this._canvasContainer.style.height = `${this._config.canvasDisplayHeightWinMode}px`;
    resetClassName(this._canvasContainer);
    this._canvasContainer.classList.add(
      'canvas-container',
      'canvas-container-win',
    );
  }

  private setCanvasFullStyle(): void {
    assert(!this.isWinMode);
    // update canvas
    resetClassName(this._canvas);
    this._canvas.classList.add('canvas', 'canvas-full');
    this._canvasContainer.style.width = '100%';
    this._canvasContainer.style.height = '100%';
    // update canvas container
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
      fontSize: this._config.eventLogConfig.fontSize,
      lineHeight: this._config.eventLogConfig.lineHeight,
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
      fontSize: this._config.consoleConfig.fontSize,
      lineHeight: this._config.consoleConfig.lineHeight,
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
    this.focus(); // give focus to panel
  }

  focus(): void {
    this._panel.focus(); // onFocus called
  }

  protected setAllPanelsToWinMode(): void {
    for (const panel of Panel.getPanelList()) {
      panel._panelContainerWinFull.style.display = 'block';
      panel._panelContainer.style.display = 'block';
      // force all panels to win mode
      panel.setViewMode(ViewMode.WIN);
      if (panel !== this) {
        panel.toWinStyle();
      }
    }
  }

  private hideOtherPanels(): void {
    for (const panel of Panel.getPanelList()) {
      if (panel !== this) {
        panel.hide();
      }
    }
  }

  protected hide(): void {
    this._panelContainerWinFull.style.display = 'none';
    this._panelContainer.style.display = 'none';
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

  protected toWinStyle(): void {
    assert(this.isWinMode);
    if (!this.isPanelInsideParentContainer()) {
      this.appendPanelTo(this._panelContainer);
    }
    this.setWinStyle();
    this.resetGui();
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
    this.updateStats(this.boardEl);
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

  protected resetGui(): void {
    this._menuGui?.removefromDom();
    this.initGui();
  }

  private toFullWinStyle(): void {
    assert(this.isFullWin);
    if (this.isInit() || this._preViewMode === ViewMode.WIN) {
      assert(this.isInit() || this.isPanelInsideParentContainer());
      this.appendPanelTo(this._panelContainerWinFull);
      this.setEventLogVisibility(this.isEventLogVisible);
      this.setFullStyle();
      this.resetGui();
    }
    assert(this._panel.parentNode === this._panelContainerWinFull);
  }

  private updateStats(parent: HTMLDivElement): void {
    this._stats.setParentNode(parent);
    this.setStatsVisible(this.isStatsVisible);
  }

  protected setFullStyle(): void {
    this.setPanelFullStyle();
    this.setCanvasFullStyle();
    this._console?.setOnFullMode(); // TODO check from here...
    if (this._eventLog) {
      this.setEventLogBottomPanelFullStyle(); // TODO not necessary?
      this._eventLog.render(true);
    }
    this.updateStats(this.panelEl);
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
      'event-log-bottom-panel-full',
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

  toggleFullscreen(): void {
    this.setFullScreen(!this.isFullScreen);
  }

  toggleFullWin(): void {
    if (!this.isFullScreen) {
      this.setFullWin(!this.isFullWin);
    } else {
      this._preViewMode = ViewMode.FULL_WIN;
      this.setFullScreen(false);
    }
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

  public setStatsVisible(visible: boolean): void {
    assert(this._stats);
    this.config.statsConfig.show = visible;
    if (visible) {
      this._stats.show();
    } else {
      this._stats.hide();
    }
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

  protected initGui(): void {
    if (!this._menuGui) {
      this._menuGui = new PanelGui();
    }
    this._menuGui.init(this);
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
      this.focus();
    }
  }

  run(): void {
    this.initWinMode();
    this.initFullWinMode();
    this.initFocus();
  }

  protected destroy() {}

  get isWinMode(): boolean {
    return this._viewMode === ViewMode.WIN;
  }

  get canvasContainerEl(): HTMLDivElement {
    return this._canvasContainer;
  }

  get panelContainerFullWinEl(): HTMLDivElement {
    return this._panelContainerWinFull;
  }

  get panelContainerEl(): HTMLDivElement {
    return this._panelContainer;
  }

  get panelEl(): HTMLDivElement {
    return this._panel;
  }

  get boardEl(): HTMLDivElement {
    return this._board;
  }

  get canvasEl(): HTMLCanvasElement {
    return this._canvas;
  }

  get menuGuiContainer(): HTMLDivElement {
    return this.isFullWin
      ? this.panelContainerFullWinEl
      : this.panelContainerEl;
  }

  get menuGuiBarMode(): string {
    return this.isWin ? 'offset' : 'full';
  }

  get isWin(): boolean {
    return !(this.isFullWin || this.isFullScreen);
  }

  get isFullWin(): boolean {
    return this._viewMode === ViewMode.FULL_WIN;
  }

  get isFullScreen(): boolean {
    // screenfull.isEnabled
    return this._viewMode === ViewMode.FULL_SCREEN;
  }

  get title(): string {
    return this.config.title;
  }

  get config(): PanelConfig {
    return this._config;
  }

  get console(): Console | null {
    return this._console ?? null;
  }

  get menuGui(): PanelGui | null {
    return this._menuGui ?? null;
  }

  protected set menuGui(menuGui: PanelGui | null) {
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

  public get isStatsVisible(): boolean {
    return this.config.statsConfig.show;
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
