// import assert from 'assert';

interface WebGPUInitInput {
  canvas: OffscreenCanvas;
  format?: GPUTextureFormat;
  msaaCount?: number;
  background: { r: number; g: number; b: number; a: number };
}

interface WebGPUInit {
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  size: { width: number; height: number };
  background: { r: number; g: number; b: number; a: number };
  msaaCount: number;
}

interface WebGPUPipelineInput {
  // device: GPUDevice,
  // format?: GPUTextureFormat,
  frontFace?: GPUFrontFace;
  primitiveType?: GPUPrimitiveTopology;
  indexFormat?: GPUIndexFormat;
  cullMode?: GPUCullMode;
  // msaaCount?: number,
  isDepthStencil?: boolean;
  buffers?: Iterable<GPUVertexBufferLayout>;
  shader?: string;
  vsShader?: string;
  fsShader?: string;
  vsEntry?: string;
  fsEntry?: string;
}

interface WebGPUPipeline {
  pipelines?: GPURenderPipeline[];
  csPipelines?: GPUComputePipeline[];
  gpuTextures?: GPUTexture[];
  depthTextures?: GPUTexture[];
  vertexBuffers?: GPUBuffer[];
  uniformBuffers?: GPUBuffer[];
  uniformBindGroups?: GPUBindGroup[];
  numVertices?: number;
  numInstances?: number;
  msaaCount?: number;
}

interface WebGPURenderPassInput {
  textureView?: GPUTextureView;
  depthView?: GPUTextureView;
}

abstract class WebGPURenderer {
  protected params: WebGPUInitInput;
  protected renderInit: WebGPUInit;

  public async init(params: WebGPUInitInput): Promise<void> {
    this.params = params;
    await this.initWebGPU();
    this.printGPUInfo();
  }

  private async initWebGPU(): Promise<void> {
    const entry: GPU = navigator.gpu;
    if (!entry) {
      throw new Error('WebGPU is not supported on this device');
    }

    this.params.format = this.params.format ?? entry.getPreferredCanvasFormat();
    this.params.msaaCount = this.params.msaaCount ?? 1;

    // this.adapter = (await entry.requestAdapter()) as GPUAdapter;
    // this.device = await this.adapter.requestDevice();
    // this.queue = this.device.queue;

    const adapter = await entry.requestAdapter();
    if (!adapter) {
      throw new Error('No adapter found');
    }
    const device = await adapter.requestDevice();

    // device.lost
    //   .then((info) => {
    //     console.error(`WebGPU device was lost: ${info.message}`);
    //     // 'reason' will be 'destroyed' if we intentionally destroy the device.
    //     if (info.reason !== 'destroyed') {
    //       console.error('Attempting to recover the GPU device...');
    //       // TODO:
    //     }
    //   })
    //   .catch((e) => {
    //     console.error('WebGPU device lost promise rejected:', e);
    //   });

    const context = this.params.canvas.getContext('webgpu') as GPUCanvasContext;

    // const pixelRatio = window.devicePixelRatio || 1;
    // input.canvas.width = input.canvas.clientWidth * pixelRatio;
    // input.canvas.height = input.canvas.clientHeight * pixelRatio;
    const size = {
      width: this.params.canvas.width,
      height: this.params.canvas.height,
    };

    context.configure({
      device,
      format: this.params.format,
      alphaMode: 'opaque',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    this.renderInit = {
      adapter,
      device,
      context,
      format: this.params.format,
      size,
      background: { ...this.params.background },
      msaaCount: this.params.msaaCount,
    };
  }

  protected printGPUInfo(): void {
    const { adapter } = this.renderInit;
    const { info } = adapter;

    const gpuInfo = `GPU Info:
   Vendor: ${info.vendor}
   Architecture: ${info.architecture}
   Description: ${info.description}
   Device: ${info.device}`;

    console.log(gpuInfo);

    {
      console.log('GPU Supported Limits:');
      let i: keyof GPUSupportedLimits;
      for (i in adapter.limits) {
        console.log(i, adapter.limits[i]);
      }
    }

    {
      console.log('GPU Features:');
      for (const item of adapter.features) {
        console.log(item);
      }
    }
  }

  protected createRenderPipelineDescriptor(
    input: WebGPUPipelineInput,
  ): GPURenderPipelineDescriptor {
    input.frontFace = input.frontFace ?? 'ccw';
    input.primitiveType = input.primitiveType ?? 'triangle-list';
    input.cullMode = input.cullMode ?? 'none';
    input.isDepthStencil = input.isDepthStencil ?? true;
    input.vsEntry = input.vsEntry ?? 'vs_main';
    input.fsEntry = input.fsEntry ?? 'fs_main';

    if (input.shader) {
      input.vsShader = input.shader;
      input.fsShader = input.shader;
    }

    input.indexFormat = input.indexFormat ?? 'uint32';

    let indexFormat: GPUIndexFormat | undefined;

    if (input.primitiveType.includes('strip')) {
      indexFormat = input.indexFormat;
    }

    const { device } = this.renderInit;

    // assert(input.vsShader);

    const vsmDesc = { code: input.vsShader! };
    const vertModule = device.createShaderModule(vsmDesc);

    // assert(input.fsShader);
    const fsmDesc = { code: input.fsShader! };
    const fragModule = device.createShaderModule(fsmDesc);

    const vertex: GPUVertexState = {
      module: vertModule,
      entryPoint: input.vsEntry,
      ...(input.buffers && { buffers: input.buffers }),
    };

    const colorState: GPUColorTargetState = {
      format: this.renderInit.format,
    };

    const fragment: GPUFragmentState = {
      module: fragModule,
      entryPoint: input.fsEntry,
      targets: [colorState],
    };

    const primitive: GPUPrimitiveState = {
      frontFace: input.frontFace,
      topology: input.primitiveType,
      cullMode: input.cullMode,
      ...(indexFormat && { stripIndexFormat: indexFormat }),
    };

    const multisample: GPUMultisampleState = {
      count: this.renderInit.msaaCount,
    };

    const depthStencil: GPUDepthStencilState | undefined = input.isDepthStencil
      ? {
          depthWriteEnabled: true,
          depthCompare: 'less',
          // format: 'depth24plus',
          format: 'depth24plus-stencil8',
        }
      : undefined;

    const descriptor: GPURenderPipelineDescriptor = {
      layout: 'auto',
      vertex,
      fragment,
      primitive,
      multisample,
      ...(depthStencil && { depthStencil }),
    };

    return descriptor;
  }

  protected createRenderPassDescriptor(
    input: WebGPURenderPassInput,
    withColorAttachment = true,
  ): GPURenderPassDescriptor {
    const colorAttachmentView =
      this.renderInit.msaaCount > 1 && input.textureView
        ? input.textureView
        : this.renderInit.context.getCurrentTexture().createView();

    const colorAttachmentResolveTarget =
      this.renderInit.msaaCount > 1
        ? this.renderInit.context.getCurrentTexture().createView()
        : undefined;

    // assert(colorAttachmentView);

    const colorAttachment: GPURenderPassColorAttachment | undefined =
      withColorAttachment
        ? {
            view: colorAttachmentView,
            ...(colorAttachmentResolveTarget && {
              resolveTarget: colorAttachmentResolveTarget,
            }),
            clearValue: this.renderInit.background,
            loadOp: 'clear',
            storeOp: 'store',
          }
        : undefined;

    const depthAttachment: GPURenderPassDepthStencilAttachment | undefined =
      input.depthView
        ? {
            view: input.depthView,
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store',
          }
        : undefined;

    const renderPassDesc: GPURenderPassDescriptor = {
      colorAttachments: colorAttachment ? [colorAttachment] : [],
      ...(depthAttachment && { depthStencilAttachment: depthAttachment }),
    };

    return renderPassDesc;
  }

  protected abstract createRenderPipeline(
    input: WebGPUPipelineInput,
  ): Promise<WebGPUPipeline>;

  public abstract render(): void;
}

export type {
  WebGPUInitInput,
  WebGPUInit,
  WebGPUPipelineInput,
  WebGPUPipeline,
  WebGPURenderPassInput,
};

export { WebGPURenderer };
