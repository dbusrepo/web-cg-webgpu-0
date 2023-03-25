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
  private _images: BitImage[]; // RGBA, PAL_IDX ?
  private _imagesTotalSize: number;
  private _wasmEngine: WasmEngine;

  public async init(cfg: EngineImplConfig): Promise<void> {
    this._cfg = cfg;
    await this._loadImages();
    await this._initWasmEngine();
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
}

export { EngineImpl, EngineImplConfig };
