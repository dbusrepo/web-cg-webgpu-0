import type {
  WebGPUInitInput,
  WebGPUPipelineInput,
  WebGPUPipeline,
} from './renderer';
import shader from './triangleVertexColor.wgsl';
import { WebGPURenderer } from './renderer';

class TriangleVertexColorRenderer extends WebGPURenderer {
  private trianglePipeline: WebGPUPipeline;

  public async init(params: WebGPUInitInput): Promise<void> {
    await super.init(params);
    await this.initPipeline();
  }

  private async initPipeline(): Promise<void> {
    const input: WebGPUPipelineInput = {
      shader,
      isDepthStencil: false,
    };
    this.trianglePipeline = await this.createRenderPipeline(input);
  }

  protected async createRenderPipeline(
    input: WebGPUPipelineInput,
  ): Promise<WebGPUPipeline> {
    const pipelineDesc = this.createRenderPipelineDescriptor(input);
    const pipeline =
      await this.renderInit.device.createRenderPipelineAsync(pipelineDesc);
    const renderPipeline: WebGPUPipeline = {
      pipelines: [pipeline],
    };
    return renderPipeline;
  }

  public render(): void {
    const commandEncoder = this.renderInit.device.createCommandEncoder();
    const renderPassInput = {};
    const renderPassDesc = this.createRenderPassDescriptor(renderPassInput);
    const renderPass = commandEncoder.beginRenderPass(renderPassDesc);
    renderPass.setPipeline(this.trianglePipeline.pipelines![0]!);
    renderPass.draw(3);
    renderPass.end();
    this.renderInit.device.queue.submit([commandEncoder.finish()]);
  }
}

export { TriangleVertexColorRenderer };
export { type WebGPUInitInput } from './renderer';
