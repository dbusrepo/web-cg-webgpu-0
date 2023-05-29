enum AppCommandsEnum {
  INIT = 'init',
  UPDATE_STATS = 'updateStats',
  EVENT = 'event',
  REGISTER_KEY_HANDLER = 'register_handler',
}

enum AppPanelsIdEnum {
  ENGINE = 'engine',
  VIEW = 'view',
}

type PanelId = `${AppPanelsIdEnum}`;

enum KeyEventsEnum {
  KEY_DOWN = 'keydown',
  KEY_UP = 'keyup',
}

type KeyEvent = `${KeyEventsEnum}`;

type InputEvent = {
  code: string;
  panelId: string;
}

export type { KeyEvent, InputEvent, PanelId };
export { AppCommandsEnum, AppPanelsIdEnum, KeyEventsEnum };
