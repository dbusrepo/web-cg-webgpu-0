import assert from 'assert';

class FpsSpan {
  private _span: HTMLSpanElement;

  constructor(parentNode: HTMLElement) {
    this._span = document.createElement('span');
    this._span.classList.add('fpsSpan');
    parentNode.appendChild(this._span);
  }

  update(fps: number) {
    this._span.textContent = `${fps}`;
  }
}

export { FpsSpan };
