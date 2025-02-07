import { render as preactRender } from 'preact';

import { type ConsoleConfig } from '../../config/mainConfig';
import { type ConsoleEntry } from './consoleHistoryPanel';
import { ConsolePanel, type ConsolePanelProps } from './consolePanel';

type ConsoleHandlerInput = unknown[]; // TODO

type ConsoleHandlerOutput = string | undefined; // TODO check

type ConsoleHandlerFunction = (
  ...args: ConsoleHandlerInput
) => ConsoleHandlerOutput;

type ConsoleHandlerConfig = object; // TODO

// used only as input for the console constructor
// Note: this is a function type with properties
interface ConsoleHandlerFunObj {
  // callables with a config property
  (...args: ConsoleHandlerInput): ConsoleHandlerOutput;
  config?: ConsoleHandlerConfig;
  isDefault?: boolean;
}

interface ConsoleHandler {
  fn: ConsoleHandlerFunction;
  stmtKey?: string; // optional for the default handler...
  config?: ConsoleHandlerConfig;
}

type ConsoleHandlersObjInit = Record<string, ConsoleHandlerFunObj>;

// TODO not used ?
// const defaultHandler: ConsoleHandlerFunObj = (...args: any[]) => '';

class Console {
  private cfg: ConsoleConfig;
  private history: ConsoleEntry[];
  private container: HTMLDivElement;
  private defaultHandler: ConsoleHandlerFunObj | undefined;
  private handlers: Record<string, ConsoleHandler>;
  private panel: ConsolePanel;
  private percHeight: number;

  constructor(
    container: HTMLDivElement,
    config: ConsoleConfig,
    handlers: ConsoleHandlersObjInit,
  ) {
    this.cfg = config;
    this.history = [];
    this.handlers = {};
    this.percHeight = config.percHeightWin; // TODO
    this.container = container;
    this.defaultHandler = undefined;

    if (handlers) {
      for (const [stmtKey, handler] of Object.entries(handlers)) {
        this.register(stmtKey, handler);
      }
    }
  }

  // msg is the result, stmt is the command given
  private log(stmt: string, msg: string): void {
    // console.log(message, instruction);
    const consoleEntry: ConsoleEntry = {
      stmt,
      msg,
    };
    this.history.push(consoleEntry);
    this.render();
  }

  private render(): Console {
    // console.log('ciao');
    // if (this._starting) { // TODO remove?
    //   this._starting = false;
    //   this.log('', this._config.welcome); // this renders again...
    //   return;
    // }

    const panelProps: ConsolePanelProps = {
      ...this.cfg,
      container: this.container,
      percHeight: this.percHeight,
      history: this.history,
      dispatch: this.dispatch.bind(this),
      autoCompleteFn: this.autoComplete.bind(this),
    };

    const panel = (
      <ConsolePanel ref={(p) => (this.panel = p)} {...panelProps} />
    );
    preactRender(panel, this.container);
    return this;
  }

  // TODO not used
  setOpen(visible: boolean): void {
    this.panel.setOpen(visible);
  }

  clear(): void {
    while (this.history.length > 0) {
      // TODO
      this.history.shift();
    }
    this.render();
  }

  register(stmtKey: string, handler: ConsoleHandlerFunObj): Console {
    if (handler.isDefault) {
      this.defaultHandler = handler;
    } else {
      const eventHandler: ConsoleHandler = {
        fn: handler,
        stmtKey,
        ...(handler.config ? { config: handler.config } : {}),
      };
      this.handlers[stmtKey] = eventHandler;
    }
    return this;
  }

  // autocomplete only on the first token (here called stmtKey)
  autoComplete(prefix: string): string {
    if (this.cfg.autoComplete) {
      const stmtKeys = Object.keys(this.handlers);
      const matched = stmtKeys.filter(
        (stmtKey) => stmtKey.indexOf(prefix) === 0,
      );
      if (matched.length === 1) {
        return matched[0]!;
      }
      // TODO
      // this.log(prefix);
      // this.log(matched.map(n => '  ' + n).join('\n')); // list them all
      // return prefix;
    }
    return prefix; // TODO
  }

  dispatch(stmt: string): void {
    const [arg0, ...argsArr] = stmt.split(' ');
    const key = this.cfg.caseSensitive ? arg0 : arg0!.toLowerCase();
    const args = argsArr.join(' ');

    let result;
    const handler = key && this.handlers[key];
    if (handler) {
      result = handler.fn(args);
    } else if (this.defaultHandler) {
      result = this.defaultHandler(args);
    }

    // eslint-disable-next-line i18n-text/no-en
    const DEF_RES: ConsoleHandlerOutput = 'Unknown command';

    this.log(stmt, `-> ${result ?? DEF_RES}`); // TODO add -> to cfg ?
  }

  setFontSize(fontSize: number): void {
    this.cfg.fontSize = fontSize;
    this.render();
  }

  setLineHeight(lineHeight: number): void {
    this.cfg.lineHeight = lineHeight;
    this.render();
  }

  setOnWinMode(): void {
    this.percHeight = this.cfg.percHeightWin;
    this.render();
  }

  setOnFullMode(): void {
    this.percHeight = this.cfg.percHeightFull;
    this.render();
  }

  deinit(): void {
    preactRender('', this.container);
    // this.element = null; // Removed !
  }

  // setContainer(cont: HTMLDivElement) {
  //   console.log('update console container');
  //   this.deinit();
  //   this._container = cont;
  //   this._render();
  // }
}

export { Console };
export type { ConsoleHandlersObjInit, ConsoleHandlerFunObj };
export type { OnConsoleEventHandler } from './consolePanel';
