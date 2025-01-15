// import assert from 'assert';

type RenderInitInput = {
  canvas: OffscreenCanvas;
  format?: GPUTextureFormat;
  msaaCount?: number;
};

type RenderInit = {
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  size: { width: number; height: number };
  background: { r: number; g: number; b: number; a: number };
  msaaCount: number;
};

type RenderPipelineInput = {
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
};

type RenderPipeline = {
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
};

type RenderPassInput = {
  textureView?: GPUTextureView;
  depthView?: GPUTextureView;
};

abstract class Renderer {
//   protected params: RenderInitInput;
//   protected renderInit: RenderInit;
//
//   public async init(params: RenderInitInput) {
//     this.params = params;
//     await this.initWebGPU();
//     await this.printGPUInfo();
//   }
//
//   private async initWebGPU() {
//     const entry: GPU = navigator.gpu;
//     if (!entry) {
//       throw new Error('WebGPU is not supported on this device');
//     }
//
//     this.params.format = this.params.format ?? entry.getPreferredCanvasFormat();
//     this.params.msaaCount = this.params.msaaCount ?? 1;
//
//     // this.adapter = (await entry.requestAdapter()) as GPUAdapter;
//     // this.device = await this.adapter.requestDevice();
//     // this.queue = this.device.queue;
//
//     const adapter = await entry.requestAdapter();
//     if (!adapter) {
//       throw new Error('No adapter found');
//     }
//     const device = await adapter.requestDevice();
//
//     device.lost
//       .then((info) => {
//         console.error(`WebGPU device was lost: ${info.message}`);
//         // 'reason' will be 'destroyed' if we intentionally destroy the device.
//         if (info.reason !== 'destroyed') {
//           console.error('Attempting to recover the GPU device...');
//           // TODO:
//         }
//       })
//       .catch((e) => {
//         console.error('WebGPU device lost promise rejected:', e);
//       });
//
//     const context = this.params.canvas.getContext('webgpu') as GPUCanvasContext;
//
//     // const pixelRatio = window.devicePixelRatio || 1;
//     // input.canvas.width = input.canvas.clientWidth * pixelRatio;
//     // input.canvas.height = input.canvas.clientHeight * pixelRatio;
//     const size = {
//       width: this.params.canvas.width,
//       height: this.params.canvas.height,
//     };
//
//     context.configure({
//       device,
//       format: this.params.format,
//       alphaMode: 'opaque',
//       usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
//     });
//
//     const background = { r: 0, g: 0, b: 0, a: 1.0 };
//
//     this.renderInit = {
//       adapter,
//       device,
//       context,
//       format: this.params.format,
//       size,
//       background,
//       msaaCount: this.params.msaaCount,
//     };
//   }
//
//   protected async printGPUInfo(): Promise<void> {
//     const { adapter } = this.renderInit;
//
//     const { info } = await adapter;
//
//     const gpuInfo = `GPU Info:
// Vendor: ${info.vendor}
// Architecture: ${info.architecture}
// Description: ${info.description}
// Device: ${info.device}`;
//
//     console.log(gpuInfo);
//
//     {
//       console.log('GPU Supported Limits:');
//       let i: keyof GPUSupportedLimits;
//       // eslint-disable-next-line guard-for-in
//       for (i in adapter.limits) {
//         console.log(i, adapter.limits[i]);
//       }
//     }
//
//     {
//       console.log('GPU Features:');
//       for (const item of adapter.features) {
//         console.log(item);
//       }
//     }
//   }
//
//   protected createRenderPipelineDescriptor(input: RenderPipelineInput): GPURenderPipelineDescriptor {
//     input.frontFace = input.frontFace ?? 'ccw';
//     input.primitiveType = input.primitiveType ?? 'triangle-list';
//     input.cullMode = input.cullMode ?? 'none';
//     input.isDepthStencil = input.isDepthStencil ?? true;
//     input.vsEntry = input.vsEntry ?? 'vs_main';
//     input.fsEntry = input.fsEntry ?? 'fs_main';
//
//     if (input.shader) {
//       input.vsShader = input.shader;
//       input.fsShader = input.shader;
//     }
//
//     input.indexFormat = input.indexFormat ?? 'uint32';
//
//     let indexFormat: GPUIndexFormat | undefined;
//
//     if (input.primitiveType.includes('strip')) {
//       indexFormat = input.indexFormat;
//     }
//
//     const { device } = this.renderInit;
//
//     // assert(input.vsShader);
//
//     const vsmDesc = { code: input.vsShader! };
//     const vertModule = device.createShaderModule(vsmDesc);
//
//     // assert(input.fsShader);
//     const fsmDesc = { code: input.fsShader! };
//     const fragModule = device.createShaderModule(fsmDesc);
//
//     const vertex: GPUVertexState = {
//       module: vertModule,
//       entryPoint: input.vsEntry,
//       buffers: input.buffers,
//     };
//
//     const colorState: GPUColorTargetState = {
//       format: this.renderInit.format,
//     };
//
//     const fragment: GPUFragmentState = {
//       module: fragModule,
//       entryPoint: input.fsEntry,
//       targets: [colorState],
//     };
//
//     const primitive: GPUPrimitiveState = {
//       frontFace: input.frontFace,
//       topology: input.primitiveType,
//       cullMode: input.cullMode,
//       stripIndexFormat: indexFormat,
//     };
//
//     const multisample: GPUMultisampleState = {
//       count: this.renderInit.msaaCount,
//     };
//
//     const depthStencil: GPUDepthStencilState | undefined = input.isDepthStencil
//       ? {
//           depthWriteEnabled: true,
//           depthCompare: 'less',
//           // format: 'depth24plus',
//           format: 'depth24plus-stencil8',
//         }
//       : undefined;
//
//     let descriptor: GPURenderPipelineDescriptor = {
//       layout: 'auto',
//       vertex,
//       fragment,
//       primitive,
//       multisample,
//       depthStencil,
//     };
//
//     return descriptor;
//   }
//
//   protected createRenderPassDescriptor(input: RenderPassInput, withColorAttachment = true): GPURenderPassDescriptor {
//     const colorAttachmentView =
//       this.renderInit.msaaCount > 1 ? input.textureView : this.renderInit.context.getCurrentTexture().createView();
//
//     const colorAttachmentResolveTarget =
//       this.renderInit.msaaCount > 1 ? this.renderInit.context.getCurrentTexture().createView() : undefined;
//
//     // assert(colorAttachmentView);
//
//     const colorAttachment: GPURenderPassColorAttachment | undefined = withColorAttachment
//       ? {
//           view: colorAttachmentView,
//           resolveTarget: colorAttachmentResolveTarget,
//           clearValue: this.renderInit.background,
//           loadOp: 'clear',
//           storeOp: 'store',
//         }
//       : undefined;
//
//     const depthAttachment: GPURenderPassDepthStencilAttachment | undefined = input.depthView
//       ? {
//           view: input.depthView,
//           depthClearValue: 1,
//           depthLoadOp: 'clear',
//           depthStoreOp: 'store',
//           stencilClearValue: 0,
//           stencilLoadOp: 'clear',
//           stencilStoreOp: 'store',
//         }
//       : undefined;
//
//     const renderPassDesc: GPURenderPassDescriptor = {
//       colorAttachments: colorAttachment ? [colorAttachment] : [],
//       depthStencilAttachment: depthAttachment,
//     };
//
//     return renderPassDesc;
//   }
//
//   protected abstract createRenderPipeline(input: RenderPipelineInput): Promise<RenderPipeline>;
//
//   public abstract render(): void;
}

export type { RenderInitInput, RenderInit, RenderPipelineInput, RenderPipeline };
export { Renderer };
