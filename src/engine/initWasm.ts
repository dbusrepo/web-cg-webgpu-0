// ****** WASM IMPORT (wasm built from wat)
// import clear_canvas_wasm from './wasm/build/wat/clear_canvas.wasm';
// import clear_test_wasm from './wasm/bin/clear_test.wasm';

import { clearCanvasWasm, clearCanvasWasmTypes } from './ascModulesLoader';

type ClearCanvasFunType = typeof clearCanvasWasmTypes.clearCanvasVec;
type ClearCanvasRowsFunType = typeof clearCanvasWasmTypes.clearCanvasRows;

type AscExportType = {
  // list asc functions with their types here
  clearCanvasVec: ClearCanvasFunType;
  clearCanvasRows: ClearCanvasRowsFunType;
};

/* */

const BPP = 4;
const INITIAL_RESERVED_SIZE = 1000;

/* */

type FrameData = {
  frameWidth: number;
  frameHeight: number;
};

interface WasmInDataType extends FrameData {
  wasmMemory: WebAssembly.Memory;
}

/* */

const MemoryRegionNames = {
  RESERVED: 'reserved',
  FRAMEBUFFER: 'framebuffer',
};

type MemRegionNameType = keyof typeof MemoryRegionNames;

// type to hold regions info both as key->info and as [idx]->info
type MemoryRegionsInfoType = number[] & {
  [key in MemRegionNameType]: number;
};

const buildMemRegionsOffset = (
  wasmInData: WasmInDataType,
): [MemoryRegionsInfoType, MemoryRegionsInfoType] => {
  const { frameWidth, frameHeight } = wasmInData;

  const memRegOffs: MemoryRegionsInfoType =
    [] as unknown as MemoryRegionsInfoType;
  const memRegSizes: MemoryRegionsInfoType =
    [] as unknown as MemoryRegionsInfoType;

  const updateSizeOffset = (
    size: number,
    off: number,
    key: string,
  ): number => {
    memRegOffs.push(off);
    memRegOffs[key as MemRegionNameType] = off;
    memRegSizes.push(size);
    memRegSizes[key as MemRegionNameType] = size;
    return off + size;
  };

  let offset = 0; // in bytes

  const reservedSize = INITIAL_RESERVED_SIZE;
  offset = updateSizeOffset(reservedSize, offset, MemoryRegionNames.RESERVED);

  const frameBufferSize = frameWidth * frameHeight * BPP;
  offset = updateSizeOffset(
    frameBufferSize,
    offset,
    MemoryRegionNames.FRAMEBUFFER,
  );

  // ...

  return [memRegOffs, memRegSizes];
};

interface WasmOutDataType {
  memory: WebAssembly.Memory;
  ascExports: AscExportType;
  memRegOffs: MemoryRegionsInfoType; // in bytes
  memRegSizes: MemoryRegionsInfoType; // in bytes
  ui8mem: Uint8Array;
  ui32mem: Uint32Array;
  ui8cFramebuffer: Uint8ClampedArray;
}

interface AscModuleImportType extends FrameData {}

type AscModuleEnvType = {
  memory: WebAssembly.Memory;
};

async function initAscModules(
  ascImport: AscModuleImportType,
  ascEnv: AscModuleEnvType,
): Promise<AscExportType> {
  const { frameWidth, frameHeight } = ascImport;

  const log = (msgNum: number, strIdx: number) => {
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
  };

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

  const clearCanvasModule = await clearCanvasWasm<typeof clearCanvasWasmTypes>({
    clearCanvas: {
      frameWidth,
      pixelCount: frameWidth * frameHeight,
      // log,
    },
    env: {
      ...ascEnv,
    },
  });

  const clearCanvasExports = clearCanvasModule.instance.exports;

  return {
    clearCanvasVec: clearCanvasExports.clearCanvasVec,
    clearCanvasRows: clearCanvasExports.clearCanvasRows,
  };
}

function buildAscImport(inData: WasmInDataType) {
  const { frameWidth, frameHeight } = inData;
  const ascImport: AscModuleImportType = {
    frameWidth,
    frameHeight,
  };
  return ascImport;
}

async function initWasm(wasmInit: WasmInDataType): Promise<WasmOutDataType> {
  const { frameWidth, frameHeight } = wasmInit;

  const memory = wasmInit.wasmMemory;

  const ascImport: AscModuleImportType = {
    frameWidth,
    frameHeight,
  };

  const ascEnv: AscModuleEnvType = {
    memory,
  };

  const ascExports = await initAscModules(ascImport, ascEnv);

  const [memRegOffs, memRegSizes] = buildMemRegionsOffset(wasmInit);

  const ui8mem = new Uint8Array(memory.buffer);
  const ui32mem = new Uint32Array(memory.buffer);
  const ui8cFramebuffer = new Uint8ClampedArray(
    memory.buffer,
    memRegOffs[MemoryRegionNames.FRAMEBUFFER as MemRegionNameType],
    memRegSizes[MemoryRegionNames.FRAMEBUFFER as MemRegionNameType],
  );

  return {
    memory,
    ascExports,
    memRegOffs, // in bytes
    memRegSizes, // in bytes
    ui8mem,
    ui32mem,
    ui8cFramebuffer,
  };
}

export {
  MemoryRegionNames,
  MemRegionNameType,
  WasmInDataType,
  WasmOutDataType,
  AscExportType,
  initWasm,
};
