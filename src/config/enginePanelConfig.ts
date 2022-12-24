import { PanelConfig, panelConfig } from './panelConfig';
import { StatsConfig, statsConfig } from './statsConfig';
import {
  EnginePanelMenuConfig,
  enginePanelMenuConfig,
} from './enginePanelMenuConfig';

const enginePanelConfig = {
  ...panelConfig,
  title: '3D Panel',
  menuConfig: enginePanelMenuConfig as EnginePanelMenuConfig,
  statsConfig,
};

type EnginePanelConfig = typeof enginePanelConfig &
  PanelConfig & {
    statsConfig: StatsConfig;
    menuConfig: EnginePanelMenuConfig;
  };

export { EnginePanelConfig, enginePanelConfig };
export type { EnginePanelMenuConfig } from './enginePanelMenuConfig';
