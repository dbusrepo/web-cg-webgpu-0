import React from 'react';
import { h, render as preactRender, JSX } from 'preact';
import { EventLogPanel, EventLogPanelProps } from './eventLogPanel';
import { Event, EventLogEntry } from './eventLogHistoryPanel';
import { EventLogConfig } from '../../config/mainConfig';

type EventKey = string;

type EventHandlerInput = any[];
type EventHandlerOutput = string;
type EventHandlerFun = (...args: EventHandlerInput) => EventHandlerOutput;
type EventHandlerConfig = object; // TODO

type EventHandlerFunObj = {
  // callables with a config property
  (...args: EventHandlerInput): EventHandlerOutput;
  config?: EventHandlerConfig;
  default?: boolean;
};

type EventHandler = {
  fn: EventHandlerFun;
  eventKey?: EventKey; // optional for the default handler...
  config?: EventHandlerConfig;
};

// TODO not used?
// const defaultHandler: EventHandlerFunObj =
// (...args: EventHandlerInput) => '';

class EventLog {
  private _cfg: EventLogConfig;
  private _history: EventLogEntry[];
  private _defaultHandler: EventHandlerFunObj | null;
  private _handlers: { [k: EventKey]: EventHandler };
  private _container: HTMLDivElement;
  private _panel: JSX.Element;
  // private element: Element | null; // TODO

  constructor(
    container: HTMLDivElement,
    config: EventLogConfig,
    handlers: { [k: string]: EventHandlerFunObj },
  ) {
    this._cfg = config;
    this._container = container;
    this._history = [];
    this._handlers = {};
    this._defaultHandler = null;

    if (handlers) {
      for (const [eventKey, handler] of Object.entries(handlers)) {
        this.register(eventKey, handler);
      }
    }

    // we render here
    this.log('', this._cfg.helloMsg); // show panel background imm
    this.log('', 'micio micio bau bau'); // show panel background imm

    // let counter = 0;
    // setInterval(() => {
    //   const val = counter++; //Math.round(Math.random()*1000);
    //   this.log(this._config.helloMsg + val, 'event ' + val);
    // }, 1000);

    // setTimeout(() => {
    // this.clear();
    // let counter = 0;
    // setInterval(() => {
    //   const val = counter++; //Math.round(Math.random()*1000);
    //   this.log(this.config.welcome + val, 'event ' + val);
    // }, 1000);
    // }, 1000);

    for (let i = 0; i < 10; ++i) {
      const val = i; // Math.round(Math.random() * 1000);
      this.log('event ' + val, 'Hello ' + val);
      // this.log('', 'Hello ' + val);
    }
  }

  log(event: Event, message: string) {
    const logEntry: EventLogEntry = {
      event,
      message,
    };
    this._history.push(logEntry);
    this.render();
  }

  clear(): void {
    while (this._history.length) {
      // TODO
      this._history.shift();
    }
    this.render();
  }

  register(eventKey: EventKey, handler: EventHandlerFunObj): EventLog {
    if (handler.default) {
      this._defaultHandler = handler;
    } else {
      const eventHandler: EventHandler = {
        fn: handler,
        eventKey,
        config: handler.config,
      };
      this._handlers[eventKey] = eventHandler;
    }
    return this;
  }

  public render(scrollToBottom = false) {
    const panelProps: EventLogPanelProps = {
      // config: this.config, // not used for now
      // dispatch: this.dispatch.bind(this), // not used for now
      history: this._history,
      parentContainer: this._container,
      scrollToBottom,
      fontSize: this._cfg.fontSize,
      lineHeight: this._cfg.lineHeight,
      updateRender: (props: EventLogPanelProps) => {
        this._panel = <EventLogPanel {...props} />;
        preactRender(this._panel, this._container);
      },
      prompt: this._cfg.prompt,
    };

    this._panel = <EventLogPanel {...panelProps} />;
    preactRender(this._panel, this._container);
    return this;
  }

  dispatch(event: Event): void {
    const [eventKey, ...args] = event.split(' ');

    const DEF_RES: EventHandlerOutput = 'Unknown event';
    let result;
    const handler = this._handlers[eventKey];
    if (handler) {
      result = handler.fn(args);
    } else if (this._defaultHandler) {
      result = this._defaultHandler(args);
    }

    this.log(result ?? DEF_RES, event);
  }

  deinit(): void {
    preactRender('', this._container);
    // this.element = null;
  }

  setFontSize(fontSize: number): void {
    this._cfg.fontSize = fontSize;
    this.render();
  }

  setLineHeight(lineHeight: number): void {
    this._cfg.lineHeight = lineHeight;
    this.render();
  }

  get container(): HTMLDivElement {
    return this._container;
  }

  setContainer(value: HTMLDivElement) {
    // this.deinit();
    this._container = value;
    this.render(true); // force a re-render
  }

  // toggle(visibility) {
  //   this.panel.toggleVis(visibility);
  // }
}

export { EventLog, EventHandlerFunObj, EventHandlerInput };
