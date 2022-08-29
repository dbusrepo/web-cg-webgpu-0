import type { Image } from './image';

const enum HEADER_FIELDS {
  WIDTH = 'WIDTH',
  HEIGHT = 'HEIGHT',
};

type HeaderFieldsType = keyof typeof HEADER_FIELDS;

type HeaderFieldsData = {
  -readonly [key in HeaderFieldsType]: number;
};

const HEADER_FIELDS_SIZE: HeaderFieldsData = {
  WIDTH: 4,
  HEIGHT: 4,
};

const HEADER_SIZE = (() => {
  let size = 0;
  for (const fieldSize of Object.values(HEADER_FIELDS_SIZE)) {
    size += fieldSize;
  }
  return size;
})();

const INDEX_OFFSET_SIZE = 4;

// images in wasm memory:
// images are stored as: images index | img0 | img1 | ... where imgi is header|pixels
// index: offset for each image to the img data, 4 bytes per offset
// for each image store the header and the pixels data (rgba or indexes to palette)
// the header has width, and height...
// wasm module will use the base offset + img index to get the image data,
// skipping the header to get the pixels...
class WasmImage {

  constructor(private _image: Image) {}

  get size(): number {
    return HEADER_SIZE + this._image.data.length;
  }
}

export { WasmImage };
