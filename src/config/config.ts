import { StartViewMode, PanelConfig, panelConfig } from './panelConfig';
import {
  EnginePanelMenuConfig,
  EnginePanelConfig,
  enginePanelConfig,
} from './enginePanelConfig';
import { ViewPanelConfig, viewPanelConfig } from './viewPanelConfig';
import { EventLogConfig } from './eventLogConfig';
import { ConsoleConfig } from './consoleConfig';

const defaultConfig = {
  initial_mem_pages: 64,
  worker_heap_pages: 1,
  target_fps: 60,
  target_ups: 80,
  multiplier: 1, // TODO
  showStats: true,
  panelConfig,
  enginePanelConfig,
  viewPanelConfig,
};

type Config = typeof defaultConfig;

export {
  Config,
  StartViewMode,
  PanelConfig,
  EnginePanelMenuConfig,
  EnginePanelConfig,
  ViewPanelConfig,
  EventLogConfig,
  ConsoleConfig,
  defaultConfig,
};
