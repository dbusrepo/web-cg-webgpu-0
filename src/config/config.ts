import { StartViewMode, panelConfig } from './panelConfig';
import { EnginePanelMenuConfig, enginePanelConfig } from './enginePanelConfig';
import { viewPanelConfig } from './viewPanelConfig';
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

export { Config, StartViewMode, defaultConfig };

export type { PanelConfig } from './panelConfig';
export type { EnginePanelConfig } from './enginePanelConfig';
export type { ViewPanelConfig } from './viewPanelConfig';
export type { EventLogConfig } from './eventLogConfig';
export type { ConsoleConfig } from './consoleConfig';
export type { EnginePanelMenuConfig } from './enginePanelMenuConfig';
