import { WasmInput } from './initWasm';

// wasm import from asc compiled files
import drawWasm from './wasm/build/asc/draw.wasm';
import type drawWasmExport from './wasm/build/asc/draw';

// type AscInstance<T> = { instance: WebAssembly.Instance & { exports: T } };

type AscModules = {
  draw: typeof drawWasmExport;
};

async function loadDrawExports(
  wasmInit: WasmInput,
): Promise<typeof drawWasmExport> {
  const {
    memory,
    frameWidth,
    frameHeight,
    frameBufferSize,
    frameBufferOffset,
  } = wasmInit;

  const drawInst = await drawWasm<typeof drawWasmExport>({
    draw: {
      frameBufferSize,
      frameBufferOffset,
      frameWidth,
      frameHeight,
      log: (i: number) => console.log(`Value: ${i}`),
    },
    env: {
      memory,
      // TODO
      abort: () => {
        console.log('abort!');
      },
    },
  });

  return drawInst.instance.exports;
}

async function loadAscModules(wasmInit: WasmInput): Promise<AscModules> {
  return {
    draw: await loadDrawExports(wasmInit),
  };
}

export { AscModules, loadAscModules };

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
//     pixkl_count,
//     log: (msgIdx: number, msg: string) => {
//       console.log(`Message: ${msgIdx} ${msg}`)
//     }
//   },
// };
