type RendererParams = {
  canvas: OffscreenCanvas;
};

class Renderer {
  private params: RendererParams;

  private adapter: GPUAdapter;
  private device: GPUDevice;
  private queue: GPUQueue;

  private context: GPUCanvasContext;

  public async init(params: RendererParams) {
    this.params = params;

    await this.initAPI();
    this.initContext();
  }

  private async initAPI() {
    const entry: GPU = navigator.gpu;
    if (!entry) {
      throw new Error('WebGPU is not supported on this device');
    }

    this.adapter = (await entry.requestAdapter()) as GPUAdapter;
    this.device = await this.adapter.requestDevice();
    this.queue = this.device.queue;
  }

  private initContext() {
    this.context = this.params.canvas.getContext('webgpu') as GPUCanvasContext;
    const canvasConfig: GPUCanvasConfiguration = {
      device: this.device,
      format: 'bgra8unorm',
      alphaMode: 'opaque',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    };
    console.log(this.context);
  }
}

export type { RendererParams };
export { Renderer };
