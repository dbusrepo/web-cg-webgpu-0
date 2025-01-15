import fg from 'fast-glob';

// compiler options here: https://www.assemblyscript.org/compiler.html#command-line-options
// https://github.com/AssemblyScript/assemblyscript/pull/2157

// const asc = require("assemblyscript/cli/asc");
// const options = require("assemblyscript/cli/asc.json");

import asc from 'assemblyscript/dist/asc.js';

// relative to node invocation in package.json
const BASE_DIR = './src/engine/wasmEngine/wasm/source/asc';

// these paths instead are relative to .ts asc input files
const BUILD_DIR = '../../build';
const getSourcePath = (n) => `./${n}.ts`;
const getBinPath = (n) => `./${BUILD_DIR}/${n}.wasm`;
const getWatPath = (n) => `./${BUILD_DIR}/${n}.wat`;
const getTypesFilePath = (n) => `./${BUILD_DIR}/types-${n}.d.ts`;

const files = fg.sync(`*.ts`, { cwd: `${BASE_DIR}`, ignore: [ `*.d.ts` ] });
const fileNames = files.map((n) => (n.substring(0, n.lastIndexOf('.')) || n));

for (let fname of fileNames) {
  console.log(`\nCompiling ${fname}:`);
  const { stats, error, stdout } = await asc.main([
    getSourcePath(fname),
    '--baseDir', BASE_DIR,
    '--outFile', getBinPath(fname),
    '--textFile', getWatPath(fname),
    // "--tsdFile", getTypesFilePath(fname),
    // "--listFiles",
    '--bindings', 'esm',
    '--stats',
    '--pedantic',
    '--sourceMap',
    // '--measure',
    '--optimize', '-Ospeed',
    '--optimizeLevel', '3',
    '--shrinkLevel', '0',
    '--converge',
    // "--sourceMap", // <-- TODO
    // "--debug", // <-- TODO
    '--noExportMemory',
    '--importMemory',
    '--sharedMemory',
    '--initialMemory', '80',
    '--maximumMemory', '80',
    '--enable', 'threads',
    '--enable', 'simd',
    '--enable', 'bulk-memory',
    '--enable', 'reference-types',
    '--sharedMemory',
    '--runtime', 'stub' // <-- TODO
    // "--exportRuntime"
  ],
    {
      stdout: process.stdout,
      stderr: process.stderr
    }
  );
  if (error) {
    console.log(`Compilation of ${fname} failed: ${error.message}`);
    throw error;
  } else {
    // console.log(stdout.toString());
    console.log(stats);
  }
}

// , {
//     stdout: process.stdout,
//     stderr: process.stderr
//   }, function(err) {
//     if (err) {
//       throw err;
//     }
//     // console.log(`${fname}.ts compiled.`);
//     return 0;
//   });
// }
// });

