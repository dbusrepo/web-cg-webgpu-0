import type { Key } from '../app/keys';
import { EnginePanelInputKeysEnum } from '../app/keys';
import { InputAction, InputActionBehavior } from './inputAction';

type KeyHandler = () => void;

type KeyHandlersMap = Partial<Record<Key, KeyHandler[]>>;

class InputManager {
  private actions: Partial<Record<Key, InputAction>> = {};

  public mapKeyToAction(key: Key, action: InputAction) {
    this.actions[key] = action;
  }

  public onKeyDown(key: Key) {
    const action = this.actions[key];
    if (action) {
      action.press();
    }
  }

  public onKeyUp(key: Key) {
    const action = this.actions[key];
    if (action) {
      action.release();
    }
  }
}

export type { KeyHandler, Key };
export { InputManager, EnginePanelInputKeysEnum };
