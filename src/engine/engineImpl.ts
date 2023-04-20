// import assert from 'assert';
import * as loadUtils from './loadUtils';
import {
  // images as sourceImages,
  getImagesPaths,
} from '../assets/images/imagesList';
import { loadImages } from './assets/images/utils';
import { BitImage } from './assets/images/bitImage';
import { WasmEngine, WasmEngineConfig } from './wasmEngine/wasmEngine';
import { mainConfig } from '../config/mainConfig';
import { InputManager, KeyCode } from './input/inputManager';

type EngineImplConfig = {
  canvas: OffscreenCanvas;
};

class EngineImpl {
  private cfg: EngineImplConfig;
  private ctx: OffscreenCanvasRenderingContext2D;
  private images: BitImage[]; // RGBA, PAL_IDX ?
  private imagesTotalSize: number;
  private wasmEngine: WasmEngine;
  private inputManager: InputManager;

  public async init(cfg: EngineImplConfig): Promise<void> {
    this.cfg = cfg;
    this.initOffscreenCanvasContext();
    await this.loadImages();
    await this.initWasmEngine();
    this.initInputManager();
  }

  private initInputManager() {
    this.inputManager = new InputManager();
    this.inputManager.init();
    const onkeyDown = (key: KeyCode) => {
      // console.log('key ', key, ' state: ', down);
      // TODO map key to index
      const idx = 0;
      this.wasmEngine.inputKeyDown(idx);
    };
    const onkeyUp = (key: KeyCode) => {
      // console.log('key ', key, ' state: ', down);
      const idx = 0; // TODO map key to index
      this.wasmEngine.inputKeyUp(idx);
    };
    this.inputManager.addKeyDownHandler('KeyA', onkeyDown.bind(null, 'KeyA'));
    this.inputManager.addKeyUpHandler('KeyA', onkeyUp.bind(null, 'KeyA'));
  }

  private initOffscreenCanvasContext(): void {
    const ctx = <OffscreenCanvasRenderingContext2D>(
      this.cfg.canvas.getContext('2d', { alpha: false })
    );
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
  }

  private async loadImages() {
    const imageBuffers = await this.loadImageBuffers();
    const { imagesTotalSize, images } = await loadImages(imageBuffers);
    this.images = images;
    this.imagesTotalSize = imagesTotalSize;
  }

  private async loadImageBuffers(): Promise<ArrayBuffer[]> {
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

  private async initWasmEngine() {
    this.wasmEngine = new WasmEngine();
    const wasmEngineCfg: WasmEngineConfig = {
      ctx: this.ctx,
      imagesTotalSize: this.imagesTotalSize,
      images: this.images,
      numAuxWorkers: mainConfig.numWorkers,
    };
    await this.wasmEngine.init(wasmEngineCfg);
  }

  public render() {
    this.wasmEngine.render();
  }

  public onKeyDown(key: KeyCode) {
    this.inputManager.onKeyDown(key);
  }

  public onKeyUp(key: KeyCode) {
    this.inputManager.onKeyUp(key);
  }
}

export { EngineImpl, EngineImplConfig };
