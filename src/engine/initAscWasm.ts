import { WasmInput } from './initWasm';

// wasm import from asc compiled files
import drawWasm from './wasm/build/asc/draw.wasm';
import type drawWasmExport from './wasm/build/asc/draw';

// type AscInstance<T> = { instance: WebAssembly.Instance & { exports: T } };

interface AscWasmInput extends WasmInput {
  frameBufferOffset: number;
}

type AscExports = {
  draw: typeof drawWasmExport;
};

async function loadDrawInstance(
  ascWasmInput: AscWasmInput,
): Promise<typeof drawWasmExport> {
  const { memory, frameWidth, frameHeight, frameBufferOffset } = ascWasmInput;

  const drawInst = await drawWasm<typeof drawWasmExport>({
    draw: {
      frameBufferOffset,
      frameWidth,
      pixelCount: frameWidth * frameHeight,
      log: (i: number) => console.log(`Value: ${i}`),
    },
    env: {
      memory,
    },
  });

  drawInst.instance.exports.printValues();

  return drawInst.instance.exports;
}

async function loadAscModules(ascWasmInput: AscWasmInput): Promise<AscExports> {
  // const log = (msgNum: number, strIdx: number) => {
  // console.log('str idx is ' + strIdx);
  // const lenIdx = strIdx - 4;
  // const len = new Uint32Array(this._memory.buffer, lenIdx, 4)[0];
  // console.log('Lenght is ' + len);
  // const strBytesSrc = new Uint16Array(this._memory.buffer, strIdx, len);
  // const strBytes = strBytesSrc.slice();
  // const str = new TextDecoder('utf-16').decode(strBytes);
  // console.log('The string is ' + str);
  // const msg = clearCanvasModule.instance.exports.__getString(msgIdx);
  // console.log(`Message: ${msgNum} ${msg}`);
  // };

  // const importObject = {
  //   env: {
  //     buffer: memory,
  //     canvas_width: w, // TODO fix names?
  //     canvas_height: h,
  //     pixel_count,
  //     log: (msgIdx: number, msg: string) => {
  //       console.log(`Message: ${msgIdx} ${msg}`)
  //     }
  //   },
  // };

  const draw = await loadDrawInstance(ascWasmInput);

  return {
    draw,
    // clearCanvasVec: clearCanvasExports.clearCanvasVec,
    // clearCanvasRows: clearCanvasExports.clearCanvasRows,
  };
}

export { AscWasmInput, AscExports, loadAscModules };
