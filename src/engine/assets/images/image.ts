class Image {
  private _width: number;
  private _height: number;
  private _data: Uint8ClampedArray;

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get data(): Uint8ClampedArray {
    return this._data;
  }
}

export { Image };
