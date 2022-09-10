import { BitImage } from './bitImage';

interface ImageDecoder {
  readSize(input: ArrayBuffer): [number, number];
  read(input: ArrayBuffer, output: BitImage): void;
}

export { ImageDecoder };
