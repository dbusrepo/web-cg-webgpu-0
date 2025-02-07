import type { KeyCode } from './keyCodes';
import { type PanelId } from './appTypes';

interface KeyInputEvent {
  code: KeyCode;
  panelId: PanelId;
}

interface MouseMoveEvent {
  dx: number;
  dy: number;
}

interface CanvasDisplayResizeEvent {
  width: number;
  height: number;
}

export type { KeyInputEvent, MouseMoveEvent, CanvasDisplayResizeEvent };

export { type KeyCode } from './keyCodes';
