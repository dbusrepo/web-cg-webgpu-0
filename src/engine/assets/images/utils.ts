import { fileTypeFromBuffer } from 'file-type';
import { ImageInfo } from './imageDecoder';
import { PngDecoderRGBA } from './vivaxy-png/PngDecoderRGBA';
import { WorkerInitData, WorkerInitImagesData } from '../../workerInitTypes';
import { BitImageRGBA } from './bitImageRGBA';

async function loadImagesInitData(
  imageBuffers: ArrayBuffer[],
): Promise<WorkerInitImagesData> {
  let totalImagesSize = 0;
  const imagesSizes: [number, number][] = await Promise.all(
    imageBuffers.map(async (imgBuffer) => {
      const fileType = await fileTypeFromBuffer(imgBuffer);
      if (!fileType) {
        throw new Error(`_getImagesInitData: file type not found`);
      }
      let imgInfo: ImageInfo;
      switch (fileType.ext) {
        case 'png':
          {
            imgInfo = new PngDecoderRGBA().readInfo(imgBuffer);
          }
          break;
        default:
          throw new Error(
            `_loadImage does not support ${fileType.ext} loading`,
          );
      }
      // console.log('IMG INFO: ', imgInfo);
      totalImagesSize += imgInfo.bpp * imgInfo.width * imgInfo.height;
      return [imgInfo.width, imgInfo.height];
    }),
  );
  return { totalImagesSize, imagesSizes };
}

async function loadImageRGBA(imageBuffer: ArrayBuffer): Promise<BitImageRGBA> {
  // TODO check use palette ?
  const fileType = await fileTypeFromBuffer(imageBuffer);
  if (!fileType) {
    throw new Error(`_loadImage: file type not found`);
  }
  switch (fileType.ext) {
    case 'png': {
      const bitImage = new BitImageRGBA();
      new PngDecoderRGBA().read(imageBuffer, bitImage);
      return bitImage;
    }
    // break;
    default:
      throw new Error(`_loadImage does not support ${fileType.ext} loading`);
  }
}

export { loadImagesInitData, loadImageRGBA };
