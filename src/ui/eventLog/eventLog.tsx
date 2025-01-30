import { render as preactRender, type JSX } from 'preact';
import { EventLogPanel, type EventLogPanelProps } from './eventLogPanel';
import { type EventLogEntry } from './eventLogHistoryPanel';
import { type EventLogConfig } from '../../config/mainConfig';

type EventHandlerInput = unknown[];

type EventHandlerOutput = string | undefined;

type EventHandlerFun = (...args: EventHandlerInput) => EventHandlerOutput;

type EventHandlerConfig = object; // TODO

interface EventHandlerFunObj {
  // callables with a config property
  (...args: EventHandlerInput): EventHandlerOutput;
  config?: EventHandlerConfig;
  default?: boolean;
}

interface EventHandler {
  fn: EventHandlerFun;
  eventKey?: string; // optional for the default handler...
  config?: EventHandlerConfig;
}

// TODO not used?
// const defaultHandler: EventHandlerFunObj =
// (...args: EventHandlerInput) => '';

class EventLog {
  private cfg: EventLogConfig;
  private history: EventLogEntry[];
  private defaultHandler: EventHandlerFunObj | undefined;
  private handlers: Record<string, EventHandler>;
  private container: HTMLDivElement;
  private panel: JSX.Element;
  // private element: Element | null; // TODO

  constructor(
    container: HTMLDivElement,
    config: EventLogConfig,
    handlers: Record<string, EventHandlerFunObj>,
  ) {
    this.cfg = config;
    this.container = container;
    this.history = [];
    this.handlers = {};
    this.defaultHandler = undefined;

    if (handlers) {
      for (const [eventKey, handler] of Object.entries(handlers)) {
        this.register(eventKey, handler);
      }
    }

    // we render here
    this.log('', this.cfg.helloMsg); // show panel background imm

    // let counter = 0;
    // setInterval(() => {
    //   const val = counter++; //Math.round(Math.random()*1000);
    //   this.log('event ' + val, 'Hello' + ' ' + val);
    // }, 1000);

    // setTimeout(() => {
    // this.clear();
    // let counter = 0;
    // setInterval(() => {
    //   const val = counter++; //Math.round(Math.random()*1000);
    //   this.log(this.config.welcome + val, 'event ' + val);
    // }, 1000);
    // }, 1000);

    // for (let i = 0; i < 20; ++i) {
    //   const val = i; // Math.round(Math.random() * 1000);
    //   this.log('event ' + val, 'Hello ' + val);
    //   // this.log('', 'Hello ' + val);
    // }
  }

  log(event: string, message: string): void {
    const logEntry: EventLogEntry = {
      event,
      message,
    };
    this.history.push(logEntry);
    this.render();
  }

  clear(): void {
    while (this.history.length > 0) {
      // TODO
      this.history.shift();
    }
    this.render();
  }

  register(eventKey: string, handler: EventHandlerFunObj): EventLog {
    if (handler.default) {
      this.defaultHandler = handler;
    } else {
      const eventHandler: EventHandler = {
        fn: handler,
        eventKey,
        ...(handler.config ? { config: handler.config } : {}),
      };
      this.handlers[eventKey] = eventHandler;
    }
    return this;
  }

  public render(scrollToBottom = false): EventLog {
    const panelProps: EventLogPanelProps = {
      // config: this.config, // not used for now
      // dispatch: this.dispatch.bind(this), // not used for now
      history: this.history,
      parentContainer: this.container,
      scrollToBottom,
      fontSize: this.cfg.fontSize,
      lineHeight: this.cfg.lineHeight,
      updateRender: (props: EventLogPanelProps) => {
        this.panel = <EventLogPanel {...props} />;
        preactRender(this.panel, this.container);
      },
      prompt: this.cfg.prompt,
    };

    this.panel = <EventLogPanel {...panelProps} />;
    preactRender(this.panel, this.container);
    return this;
  }

  dispatch(event: string): void {
    const [eventKey, ...args] = event.split(' ');

    let result;
    const handler = this.handlers[eventKey!];
    if (handler) {
      result = handler.fn(args);
    } else if (this.defaultHandler) {
      result = this.defaultHandler(args);
    }

    // eslint-disable-next-line i18n-text/no-en
    this.log(result ?? 'Unknown event', event);
  }

  deinit(): void {
    preactRender('', this.container);
    // this.element = null;
  }

  setFontSize(fontSize: number): void {
    this.cfg.fontSize = fontSize;
    this.render();
  }

  setLineHeight(lineHeight: number): void {
    this.cfg.lineHeight = lineHeight;
    this.render();
  }

  setContainer(value: HTMLDivElement): void {
    // this.deinit();
    this.container = value;
    this.render(true); // force a re-render
  }

  // toggle(visibility) {
  //   this.panel.toggleVis(visibility);
  // }
}

export { EventLog };
export type { EventHandlerFunObj, EventHandlerInput };
