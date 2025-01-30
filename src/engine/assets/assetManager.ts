// import assert from 'assert';
import { loadResAsArrayBuffer } from './loadUtils';
// import map0 from '../../../assets/maps/map0.txt'
import {
  // images as sourceImages,
  getImagesUrls,
} from '../../../assets/build/images';
import { decodePNGs } from './images/utils';
import { type BitImageRGBA } from './images/bitImageRgba';
import { AssetTextureRGBA } from './assetTextureRgba';

interface AssetManagerParams {
  generateMipmaps: boolean;
  rotateTextures: boolean;
}

class AssetManager {
  private params: AssetManagerParams;
  private textures: AssetTextureRGBA[];

  public async init(params: AssetManagerParams): Promise<void> {
    this.params = params;
    await this.loadTextures();
  }

  private async loadTextures(): Promise<void> {
    const imageBuffers = await this.loadImagesBuffers();
    const bitImagesRGBA = await decodePNGs(imageBuffers);
    const bitImageRGBA2TextureAssetRGBA = (
      image: BitImageRGBA,
    ): AssetTextureRGBA =>
      new AssetTextureRGBA(image, {
        generateMipmaps: this.params.generateMipmaps,
        rotate: this.params.rotateTextures,
      });
    this.textures = bitImagesRGBA.map((image) =>
      bitImageRGBA2TextureAssetRGBA(image),
    );
  }

  private static loadUrlAsArrayBuffer(url: string): Promise<ArrayBuffer> {
    return loadResAsArrayBuffer(url);
  }

  private async loadImagesBuffers(): Promise<ArrayBuffer[]> {
    const imagesUrls = await getImagesUrls();
    const imageBuffers = await Promise.all(
      imagesUrls.map((imageUrl) => AssetManager.loadUrlAsArrayBuffer(imageUrl)),
    );
    return imageBuffers;
  }

  public get Textures(): AssetTextureRGBA[] {
    return this.textures;
  }

  public get NumTextures(): number {
    return this.textures.length;
  }

  public get PixelsDataSize(): number {
    return this.textures.reduce(
      (acc, texture) => acc + texture.PixelsDataSize,
      0,
    );
  }

  public get GenerateMipmaps(): boolean {
    return this.params.generateMipmaps;
  }
}

export { AssetManager };
