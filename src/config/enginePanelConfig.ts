import { PanelConfig, panelConfig } from './panelConfig';
import { StatsConfig, statsConfig } from './statsConfig';
import {
  EnginePanelMenuConfig,
  enginePanelMenuConfig,
} from './enginePanelMenuConfig';

const enginePanelConfig = {
  ...panelConfig,
  name: '3D Panel',
  menuConfig: enginePanelMenuConfig as EnginePanelMenuConfig,
  statsConfig,
};

type EnginePanelConfig = typeof enginePanelConfig &
  PanelConfig & {
    statsConfig: StatsConfig;
    menuConfig: EnginePanelMenuConfig;
  };

export { EnginePanelConfig, EnginePanelMenuConfig, enginePanelConfig };
