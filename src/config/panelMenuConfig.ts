const panelMenuConfig = {
  enable: true,
  controlsPaneOpen: false,

  // guiParams: {
  //   autoPlace: false,
  //   width: 200, // TODO
  //   closed: true,
  //   hideable: false,
  // } as GUIParams,

  DOM_ID: 'gui',
  CSS_CLASS: 'gui',
  MENU_LABEL: 'Menu',

  MIN_FONT_SIZE: 10,
  MAX_FONT_SIZE: 28,
  DEFAULT_FONT_SIZE: 12,
  FONT_SIZE_STEP: 1,
  MIN_LINE_HEIGHT: 10,
  MAX_LINE_HEIGHT: 28,
  DEFAULT_LINE_HEIGHT: 16,
  LINE_HEIGHT_STEP: 1,

  MENU_OPTIONS: {
    CONSOLE_OPTIONS: {
      CONSOLE: 'console',
      FONT_SIZE: 'fontSize',
      LINE_HEIGHT: 'lineHeight',
    },
    EVENT_LOG_OPTIONS: {
      EVENTS: 'events',
      POSITION: 'where',
      FONT_SIZE: 'fontSize',
      LINE_HEIGHT: 'lineHeight',
      VISIBLE: 'visible',
    },
    EVENT_LOG_POSITION_VALUES: {
      BOTTOM: 'below',
      PANEL: 'canvas',
    },
  },
};

type PanelMenuConfig = typeof panelMenuConfig;

export { panelMenuConfig, PanelMenuConfig };
