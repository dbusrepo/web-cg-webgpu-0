import { panelGuiConfig } from './panelGuiConfig';

const enginePanelGuiConfig = {
  ...panelGuiConfig,
  options: {
    // ...panelGuiConfig.MENU_OPTIONS, // TODO:
    stats: {
      key: 'stats',
      label: 'Stats',
    },
  },
};

type EnginePanelGuiConfig = typeof enginePanelGuiConfig;

export { EnginePanelGuiConfig, enginePanelGuiConfig };
