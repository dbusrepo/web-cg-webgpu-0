import { fileTypeFromBuffer } from 'file-type';
import { ImageInfo } from './imageDecoder';
import { PngDecoderRGBA } from './vivaxy-png/PngDecoderRGBA';
import { BitImageRGBA } from './bitImageRGBA';

type LoadImagesResult = {
  imagesTotalSize: number;
  images: BitImageRGBA[];
};

async function loadImages(
  imageBuffers: ArrayBuffer[],
): Promise<LoadImagesResult> {
  const pngDecoder = new PngDecoderRGBA();
  let imagesTotalSize = 0;
  const images = await Promise.all(
    imageBuffers.map(async (imgBuffer) => {
      const fileType = await fileTypeFromBuffer(imgBuffer);
      if (!fileType) {
        throw new Error(`_getImagesInitData: file type not found`);
      }
      let imgInfo: ImageInfo;
      const image = new BitImageRGBA();
      switch (fileType.ext) {
        case 'png':
          {
            imgInfo = pngDecoder.readInfo(imgBuffer);
            pngDecoder.read(imgBuffer, image);
          }
          break;
        default:
          throw new Error(
            `_loadImage does not support ${fileType.ext} loading`,
          );
      }
      imagesTotalSize += imgInfo.bpp * imgInfo.width * imgInfo.height;
      return image;
    }),
  );
  return { imagesTotalSize, images };
}

export { loadImages };
