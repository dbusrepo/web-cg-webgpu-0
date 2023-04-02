import { PanelConfig, panelConfig } from './panelConfig';
import { StatsConfig, statsConfig } from './statsConfig';

const enginePanelConfig = {
  ...panelConfig,
  title: '3D Panel',
  statsConfig,
};

type EnginePanelConfig = typeof enginePanelConfig &
  PanelConfig & {
    statsConfig: StatsConfig;
  };

export { EnginePanelConfig, enginePanelConfig };
