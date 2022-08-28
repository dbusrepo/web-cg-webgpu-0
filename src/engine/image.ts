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

// images in wasm mem:
// images are stored as: index | img0 | img1 | ... where imgi is header|pixels
// index: offset for each image to the img data, 4 bytes per offset
// for each image store the header and the pixels data
// the header has width, and height...
// wasm module will use the base offset + img index to get the image data,
// skipping the header to get the pixels
class WasmImage {

  static readonly OFFSET_SIZE = 4;

  static readonly HEADER_DESC = {
    WIDTH: 4,
    HEIGHT: 4,
  };

  static headerSize(): number {
    return Object.values(WasmImage.HEADER_DESC).reduce((size: number, fieldSize: number) => (
     size += fieldSize // padding ?
   ), 0);
  }

  constructor(private _image: Image) {}

  get size(): number {
    return WasmImage.headerSize() + this._image.data.length;
  }

}

export { Image, WasmImage };
