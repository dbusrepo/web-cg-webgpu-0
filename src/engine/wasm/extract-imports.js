var path = require("path");
const fs = require("fs");
const { EOL } = require('os');

const WASM_EXT = '.wasm';
const ASC_EXT = '.ts';
const DEP_EXT = '.d';
const BUILD_PATH = 'build/asc/';

function changeExtension(file, extension, newDir) {
  const basename = path.basename(file, path.extname(file))
  return path.join(newDir ?? path.dirname(file), basename + extension)
}

const srcFile = process.argv[2];

if (srcFile == undefined || path.extname(srcFile) !== ASC_EXT) {
  console.log('Invocation error: source file arg required');
  process.exit(1);
}

const text = fs.readFileSync(srcFile).toString();

// console.log(text);
// https://stackoverflow.com/questions/52086611/regex-for-matching-js-import-statements
// https://regex101.com/r/FEN5ks/1
const regex = /import(?:(?:(?:[ \n\t]+([^ *\n\t\{\},]+)[ \n\t]*(?:,|[ \n\t]+))?([ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)|[ \n\t]*\*[ \n\t]*as[ \n\t]+([^ \n\t\{\}]+)[ \n\t]+)from[ \n\t]*(?:['"])(?:.\/)?([^'"\n]+)(['"])/gm;
const MODULE_PATH_GRP_IDX = 4;
// console.log(regex.test(text));
const matches = Array.from(text.matchAll(regex));
if (matches.length) {
  const sourceDir = path.dirname(srcFile);
  const wasmFile = changeExtension(srcFile, WASM_EXT, BUILD_PATH);;
  const depFile = changeExtension(srcFile, DEP_EXT);
  const ostream = process.stdout;
  let depRule = `${depFile}: ${srcFile}`;
  for (const match of matches) {
    // for each imported file...
    const fileName = match[MODULE_PATH_GRP_IDX];
    const depFilePath = path.join(sourceDir, `${fileName}${DEP_EXT}`)
    depRule += ` ${depFilePath}`;
  }
  const wasmRule = `${wasmFile}: ${depFile}${EOL}`;
  ostream.write(wasmRule);
  ostream.write(EOL);
  ostream.write(depRule);
  ostream.end(EOL);
} else {
  // console.log('no imports found...');
}

// // the finish event is emitted when all data has been flushed from the stream
// writeStream.on('finish', () => {
//     console.log('wrote all data to file');
// });
