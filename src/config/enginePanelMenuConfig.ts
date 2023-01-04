import { panelMenuConfig } from './panelMenuConfig';

const enginePanelMenuConfig = {
  ...panelMenuConfig,
  MENU_OPTIONS: {
    ...panelMenuConfig.MENU_OPTIONS,
    stats: {
      label: 'Stats',
    },
  },
};

type EnginePanelMenuConfig = typeof enginePanelMenuConfig;

export { EnginePanelMenuConfig, enginePanelMenuConfig };
