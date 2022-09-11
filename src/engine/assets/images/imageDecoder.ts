import { BitImage } from './bitImage';

interface ImageDecoder {
  readSizes(input: ArrayBuffer): [number, number];
  read(input: ArrayBuffer, output: BitImage): void;
}

export { ImageDecoder };
