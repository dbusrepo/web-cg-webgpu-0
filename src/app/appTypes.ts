enum AppCommandEnum {
  INIT = 'init',
  UPDATE_STATS = 'updateStats',
  EVENT = 'event',
  REGISTER_KEY_HANDLER = 'register_handler',
}

enum PanelIdEnum {
  ENGINE = 'engine_panel',
}

type PanelId = `${PanelIdEnum}`;

enum KeyEventsEnum {
  KEY_DOWN = 'keydown',
  KEY_UP = 'keyup',
}

type KeyEvent = `${KeyEventsEnum}`;

export type { KeyEvent, PanelId };
export { AppCommandEnum, PanelIdEnum, KeyEventsEnum };
