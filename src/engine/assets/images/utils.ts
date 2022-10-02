import { fileTypeFromBuffer } from 'file-type';
import { ImageInfo } from './imageDecoder';
import { PngDecoderRGBA } from './vivaxy-png/PngDecoderRGBA';

async function getImagesInitData(imageBuffers: ArrayBuffer[]): Promise<ImageInfo[]> {
  return Promise.all(
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
      return imgInfo;
    }),
  );
}

export { getImagesInitData };
