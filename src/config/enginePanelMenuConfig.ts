import { menuConfig } from './menuConfig';

const enginePanelMenuConfig = {
  ...menuConfig,
  MENU_OPTIONS: {
    ...menuConfig.MENU_OPTIONS,
    STATS: 'Stats',
  },
};

type EnginePanelMenuConfig = typeof enginePanelMenuConfig;

export {
  EnginePanelMenuConfig,
  enginePanelMenuConfig,
}
