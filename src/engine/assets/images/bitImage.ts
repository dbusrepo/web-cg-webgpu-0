abstract class BitImage {
  protected _width: number;
  protected _height: number;
  protected _pixels: Uint8Array;

  // constructor() {}

  // call it before insert data
  setSize(w: number, h: number) {
    this._width = w;
    this._height = h;
    this._setPixels();
  }

  protected abstract _setPixels(): void;

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get pixels() {
    return this._pixels;
  }
}

export { BitImage };
