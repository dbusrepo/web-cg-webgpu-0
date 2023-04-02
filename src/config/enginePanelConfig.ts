import { PanelConfig, panelConfig } from './panelConfig';
import { StatsConfig, statsConfig } from './statsConfig';
import {
  EnginePanelGuiConfig,
  enginePanelGuiConfig,
} from './enginePanelGuiConfig';

const enginePanelConfig = {
  ...panelConfig,
  title: '3D Panel',
  guiConfig: enginePanelGuiConfig as EnginePanelGuiConfig,
  statsConfig,
};

type EnginePanelConfig = typeof enginePanelConfig &
  PanelConfig & {
    statsConfig: StatsConfig;
    guiConfig: EnginePanelGuiConfig;
  };

export { EnginePanelConfig, enginePanelConfig, enginePanelGuiConfig };
export type { EnginePanelGuiConfig } from './enginePanelGuiConfig';
