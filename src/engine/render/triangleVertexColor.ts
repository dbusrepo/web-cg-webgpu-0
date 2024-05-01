import type { RenderInitInput, RenderPipelineInput, RenderPipeline } from './renderer';
import { Renderer } from './renderer';

import shader from './triangleVertexColor.wgsl';

class TriangleVertexColor extends Renderer {
  private trianglePipeline: RenderPipeline;

  public async init(params: RenderInitInput) {
    await super.init(params);
    await this.initPipeline();
  }

  private async initPipeline(): Promise<void> {
    const input: RenderPipelineInput = {
      shader,
      isDepthStencil: false,
    };
    this.trianglePipeline = await this.createRenderPipeline(input);
  }

  protected async createRenderPipeline(input: RenderPipelineInput): Promise<RenderPipeline> {
    const pipelineDesc = this.createRenderPipelineDescriptor(input);
    const pipeline = await this.renderInit.device.createRenderPipelineAsync(pipelineDesc);
    const renderPipeline: RenderPipeline = {
      pipelines: [pipeline],
    };
    return renderPipeline;
  }

  public render(): void {
    const commandEncoder = this.renderInit.device.createCommandEncoder();
    const renderPassInput = {};
    const renderPassDesc = this.createRenderPassDescriptor(renderPassInput);
    const renderPass = commandEncoder.beginRenderPass(renderPassDesc);
    renderPass.setPipeline(this.trianglePipeline.pipelines![0]);
    renderPass.draw(3);
    renderPass.end();
    this.renderInit.device.queue.submit([commandEncoder.finish()]);
  }
}

export type { RenderInitInput };
export { TriangleVertexColor };
