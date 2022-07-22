import { PanelConfig, panelConfig } from './panelConfig';
import { EnginePanel } from '../panels/enginePanel';

const viewPanelConfig = {
  ...panelConfig,
  name: 'View Panel',
};

type ViewPanelConfig = typeof viewPanelConfig & PanelConfig;

export {
  ViewPanelConfig,
  viewPanelConfig,
};


