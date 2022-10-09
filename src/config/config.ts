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
  wasmMemStartOffset: 0,
  wasmMemStartPages: 64,
  wasmWorkerHeapPages: 1,

  // 0 -> it can expand freely after the previous mem regions 
  // TODO case != 0 not supported for now
  wasmSharedHeapSize: 0,

  wasmMemMaxPages: 1000,

  targetFPS: 60,
  targetUPS: 80,
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
