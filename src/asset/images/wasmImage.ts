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

// TODO
class WasmImage {

  constructor(private _image: Image) {}

  get size(): number {
    return HEADER_SIZE + this._image.data.length;
  }
}

export { WasmImage };
