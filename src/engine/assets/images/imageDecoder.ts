import { type BitImage } from './bitImage';

interface ImageInfo {
  width: number;
  height: number;
  depth: number;
  bpp: number; // byte per pixel
}

interface ImageDecoder {
  readInfo(input: ArrayBuffer): ImageInfo;
  read(input: ArrayBuffer, outImage: BitImage): void;
}

export type { ImageDecoder, ImageInfo };
