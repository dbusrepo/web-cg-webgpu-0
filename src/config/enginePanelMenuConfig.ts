import { panelMenuConfig } from './panelMenuConfig';

const enginePanelMenuConfig = {
  ...panelMenuConfig,
  options: {
    ...panelMenuConfig.MENU_OPTIONS,
    stats: {
      key: 'stats',
      label: 'Stats',
    },
  },
};

type EnginePanelMenuConfig = typeof enginePanelMenuConfig;

export { EnginePanelMenuConfig, enginePanelMenuConfig };
