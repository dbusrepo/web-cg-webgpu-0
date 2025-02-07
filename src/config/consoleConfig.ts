import { type OnConsoleEventHandler } from '../ui/console/console';

const consoleConfig = {
  // hotkey: 192, // KeyCode for '~' 192, esc 27
  hotkey: '~',
  isOpen: false,
  welcome: '', // welcome message
  caseSensitive: false, // whether case sensitive
  autoComplete: true, // press `tab` to auto complete
  // container: null, // container element
  // winHeight: '25%', // TODO move to config ?
  // fullwinHeight: '15%', // TODO

  // console height in win and full mode resp
  percHeightWin: 0.35, // 35%
  percHeightFull: 0.3,
  prompt: '$ ',

  fontSize: 12,
  lineHeight: 16,
};

type ConsoleConfig = typeof consoleConfig & {
  onOpening: OnConsoleEventHandler; // when it's opening
  onOpened: OnConsoleEventHandler; // when it's opened with focus on text input
  onClosing: OnConsoleEventHandler; // when it's closing
  onClosed: OnConsoleEventHandler; // when it's closed
  fontSize: number;
  lineHeight: number;
};

export { consoleConfig };
export type { ConsoleConfig };
