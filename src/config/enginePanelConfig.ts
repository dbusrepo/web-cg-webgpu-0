import { PanelConfig, panelConfig } from './panelConfig';

const enginePanelConfig = {
  ...panelConfig,
  title: '3D Panel',
};

type EnginePanelConfig = typeof enginePanelConfig & PanelConfig;

export { EnginePanelConfig, enginePanelConfig };
