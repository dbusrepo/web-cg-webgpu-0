import type { RenderInitInput, RenderInit, RenderPipelineInput, RenderPipeline } from './renderer';
import { Renderer } from './renderer';

class TriangleVertexColor extends Renderer {
  private trianglePipeline: RenderPipeline;

  protected createRenderPipeline(input: RenderPipelineInput): RenderPipeline {

  }

  protected render(): void {

  }
}

export type { RenderInitInput };
export { TriangleVertexColor };
