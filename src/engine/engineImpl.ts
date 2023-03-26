// import assert from 'assert';
import * as loadUtils from './loadUtils';
import {
  // images as sourceImages,
  getImagesPaths,
} from '../assets/images/imagesList';
import { loadImages } from './assets/images/utils';
import { BitImage } from './assets/images/bitImage';
import { WasmEngine, WasmEngineConfig } from './wasmEngine';

type EngineImplConfig = {
  numWorkers: number;
  canvas: OffscreenCanvas;
};

class EngineImpl {
  private _cfg: EngineImplConfig;
  private _ctx: OffscreenCanvasRenderingContext2D;
  private _imageData: ImageData;
  private _images: BitImage[]; // RGBA, PAL_IDX ?
  private _imagesTotalSize: number;
  private _wasmEngine: WasmEngine;

  public async init(cfg: EngineImplConfig): Promise<void> {
    this._cfg = cfg;
    this._initOffscreenCanvasContext(this._cfg.canvas);
    this._imageData = this._ctx.createImageData(
      this._cfg.canvas.width,
      this._cfg.canvas.height,
    );
    await this._loadImages();
    await this._initWasmEngine();
  }

  private _initOffscreenCanvasContext(canvas: OffscreenCanvas): void {
    const ctx = <OffscreenCanvasRenderingContext2D>(
      canvas.getContext('2d', { alpha: false })
    );
    ctx.imageSmoothingEnabled = false;
    this._ctx = ctx;
  }

  private async _loadImages() {
    const imageBuffers = await this._loadImageBuffers();
    const { imagesTotalSize, images } = await loadImages(imageBuffers);
    this._images = images;
    this._imagesTotalSize = imagesTotalSize;
  }

  private async _loadImageBuffers(): Promise<ArrayBuffer[]> {
    const imagesPaths = await getImagesPaths();
    // assert(imagesPaths.length === Object.keys(sourceImages).length);
    const imageBuffers = await Promise.all(
      imagesPaths.map(async (url) => loadUtils.loadResAsArrayBuffer(url)),
    );
    return imageBuffers;
    // test load res file as text
    // const resFile = (await import('../assets/images/images.res')).default;
    // console.log('RES HERE: ', await loadUtils.loadResAsText(resFile));
  }

  private async _initWasmEngine() {
    this._wasmEngine = new WasmEngine();
    const wasmEngineCfg: WasmEngineConfig = {
      numWorkers: this._cfg.numWorkers,
      canvas: this._cfg.canvas,
      imagesTotalSize: this._imagesTotalSize,
      images: this._images,
    };
    await this._wasmEngine.init(wasmEngineCfg);
  }

  public drawFrame() {
    this._wasmEngine.drawFrame(this._imageData);
    this._ctx.putImageData(this._imageData, 0, 0);
  }
}

export { EngineImpl, EngineImplConfig };
