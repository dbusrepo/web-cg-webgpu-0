import type { WasmEngineModule } from './wasmLoader';
import { gWasmRun } from './wasmRun';
import {
  FrameColorRGBA,
  // RGBA_RED_SHIFT,
  // RGBA_GREEN_SHIFT,
  // RGBA_BLUE_SHIFT,
  // RGBA_ALPHA_SHIFT,
  ABGR_ALPHA_SHIFT,
  ABGR_BLUE_SHIFT,
  ABGR_GREEN_SHIFT,
  ABGR_RED_SHIFT,
  // BPP_RGBA,
} from '../frameColorRgba';

const MAX_LIGHT_LEVELS = 255;
const NUM_LIGHT_LEVELS = MAX_LIGHT_LEVELS + 1;

const RED_MAX = 255;
const GREEN_MAX = 255;
const BLUE_MAX = 255;

class FrameColorRgbaWasm extends FrameColorRGBA {
  private redLightTable: Uint8Array;
  private greenLightTable: Uint8Array;
  private blueLightTable: Uint8Array;

  private redFogTable: Uint8Array;
  private greenFogTable: Uint8Array;
  private blueFogTable: Uint8Array;

  private static buildLightTable(
    tablePtr: number,
    colorMax: number,
  ): Uint8Array {
    return new Uint8Array(
      gWasmRun.WasmMem.buffer,
      tablePtr,
      (colorMax + 1) * NUM_LIGHT_LEVELS,
    );
  }

  constructor(
    redLightTablePtr: number,
    greenLightTablePtr: number,
    blueLightTablePtr: number,
    redFogTablePtr: number,
    greenFogTablePtr: number,
    blueFogTablePtr: number,
  ) {
    super();
    this.redLightTable = FrameColorRgbaWasm.buildLightTable(
      redLightTablePtr,
      RED_MAX,
    );
    this.greenLightTable = FrameColorRgbaWasm.buildLightTable(
      greenLightTablePtr,
      GREEN_MAX,
    );
    this.blueLightTable = FrameColorRgbaWasm.buildLightTable(
      blueLightTablePtr,
      BLUE_MAX,
    );
    this.redFogTable = FrameColorRgbaWasm.buildLightTable(
      redFogTablePtr,
      RED_MAX,
    );
    this.greenFogTable = FrameColorRgbaWasm.buildLightTable(
      greenFogTablePtr,
      GREEN_MAX,
    );
    this.blueFogTable = FrameColorRgbaWasm.buildLightTable(
      blueFogTablePtr,
      BLUE_MAX,
    );
  }

  lightColorABGR(colorABGR: number, intensity: number): number {
    const a = (colorABGR >> ABGR_ALPHA_SHIFT) & 0xff;
    const b = (colorABGR >> ABGR_BLUE_SHIFT) & 0xff;
    const g = (colorABGR >> ABGR_GREEN_SHIFT) & 0xff;
    const r = (colorABGR >> ABGR_RED_SHIFT) & 0xff;
    const at = a;
    const bt = this.blueLightTable[b * NUM_LIGHT_LEVELS + intensity]!;
    const gt = this.greenLightTable[g * NUM_LIGHT_LEVELS + intensity]!;
    const rt = this.redLightTable[r * NUM_LIGHT_LEVELS + intensity]!;
    const colorABGRtarget = FrameColorRGBA.colorABGR(at, bt, gt, rt);
    return colorABGRtarget;
  }

  fogColorABGR(colorABGR: number, intensity: number): number {
    const a = (colorABGR >> ABGR_ALPHA_SHIFT) & 0xff;
    const b = (colorABGR >> ABGR_BLUE_SHIFT) & 0xff;
    const g = (colorABGR >> ABGR_GREEN_SHIFT) & 0xff;
    const r = (colorABGR >> ABGR_RED_SHIFT) & 0xff;
    const at = a;
    const bt = this.blueFogTable[b * NUM_LIGHT_LEVELS + intensity]!;
    const gt = this.greenFogTable[g * NUM_LIGHT_LEVELS + intensity]!;
    const rt = this.redFogTable[r * NUM_LIGHT_LEVELS + intensity]!;
    const colorABGRtarget = FrameColorRGBA.colorABGR(at, bt, gt, rt);
    return colorABGRtarget;
  }

  lightPixel(
    frameBuffer: Uint32Array,
    pColor: number,
    intensity: number,
  ): void {
    const colorABGR = frameBuffer[pColor]!;
    const colorABGRtarget = this.lightColorABGR(colorABGR, intensity);
    frameBuffer[pColor] = colorABGRtarget;
  }

  fogPixel(frameBuffer: Uint32Array, pColor: number, intensity: number): void {
    const colorABGR = frameBuffer[pColor]!;
    const colorABGRtarget = this.fogColorABGR(colorABGR, intensity);
    frameBuffer[pColor] = colorABGRtarget;
  }
}

function getFrameColorRGBAWasmView(
  wasmEngineModule: WasmEngineModule,
): FrameColorRgbaWasm {
  const frameColorRGBAPtr = wasmEngineModule.getFrameColorRGBAPtr();
  const frameColorRGBAWasm = new FrameColorRgbaWasm(
    wasmEngineModule.getRedLightTablePtr(frameColorRGBAPtr),
    wasmEngineModule.getGreenLightTablePtr(frameColorRGBAPtr),
    wasmEngineModule.getBlueLightTablePtr(frameColorRGBAPtr),
    wasmEngineModule.getRedFogTablePtr(frameColorRGBAPtr),
    wasmEngineModule.getGreenFogTablePtr(frameColorRGBAPtr),
    wasmEngineModule.getBlueFogTablePtr(frameColorRGBAPtr),
  );
  return frameColorRGBAWasm;
}

export { FrameColorRgbaWasm, getFrameColorRGBAWasmView };
