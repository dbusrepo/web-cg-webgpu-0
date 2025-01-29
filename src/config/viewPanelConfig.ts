import { type PanelConfig, panelConfig } from './panelConfig';

const viewPanelConfig = {
  ...panelConfig,
  title: 'View Panel',
};

type ViewPanelConfig = typeof viewPanelConfig & PanelConfig;

export { viewPanelConfig };
export type { ViewPanelConfig };
