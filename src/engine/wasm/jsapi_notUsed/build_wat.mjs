// const { readFileSync, writeFileSync } = require("fs");
// const path = require("path");
// import * as path from 'path';
import fg from 'fast-glob';
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import wabt from 'wabt';

// relative to node invocation in package.json
const BASE_DIR = "./src/engine/wasm/source/wat";
const BUILD_DIR = './src/engine/wasm/build';

const getSourcePath = (n) => `${BASE_DIR}/${n}.wat`;
const getBinPath = (n) => `${BUILD_DIR}/${n}.wasm`;

const files = fg.sync(`*.wat`, { cwd: `${BASE_DIR}` });

// todo handle compile errors!
wabt().then(async (wabt) => {
  mkdirSync(BUILD_DIR, { recursive: true });
  const fileNames = files.map((n) => (n.substring(0, n.lastIndexOf('.')) || n));
  for (const fname of fileNames) {
    console.log(`\nCompiling ${fname}`);
    const watPath = getSourcePath(fname);
    const watString = readFileSync(watPath, "utf8");
    const wasmModule = wabt.parseWat(watPath, watString);
    const { buffer, log } = wasmModule.toBinary({});
    writeFileSync(getBinPath(fname), Buffer.from(buffer));
    console.log(log);
  }
});

// in package.json scripts:
// "build:wat": "node --enable-source-maps src/engine/wasm/build_wat.mjs",
