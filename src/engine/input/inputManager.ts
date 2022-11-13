type KeyCode = string;

type KeyHandler = () => void;

type KeyHandlersMap = {
  [k: KeyCode]: KeyHandler[];
};

class InputManager {
  private _keyDownHandlers: KeyHandlersMap = {};
  private _keyUpHandlers: KeyHandlersMap = {};

  public init() {}

  public addKeyDownHandler(key: KeyCode, keyHandler: KeyHandler) {
    this._keyDownHandlers[key] = this._keyDownHandlers[key] ?? [];
    this._keyDownHandlers[key].push(keyHandler);
    postMessage({
      command: 'register_keydown_handler',
      params: key,
    });
  }

  public addKeyUpHandler(key: KeyCode, keyHandler: KeyHandler) {
    this._keyUpHandlers[key] = this._keyUpHandlers[key] ?? [];
    this._keyUpHandlers[key].push(keyHandler);
    postMessage({
      command: 'register_keyup_handler',
      params: key,
    });
  }

  public onKeyDown(key: KeyCode) {
    const hs = this._keyDownHandlers[key] ?? [];
    hs.forEach((h) => h());
  }

  public onKeyUp(key: KeyCode) {
    const hs = this._keyUpHandlers[key] ?? [];
    hs.forEach((h) => h());
  }
}

export { InputManager, KeyCode };
