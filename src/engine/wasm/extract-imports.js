var path = require("path");
const fs = require("fs");
const { EOL } = require('os');

function changeExtension(file, extension, newDir) {
  const basename = path.basename(file, path.extname(file))
  return path.join(newDir ?? path.dirname(file), basename + extension)
}

const file = process.argv[2];
if (file == undefined) {
  console.log('Extract imports error: input file required!');
  process.exit(1);
}
const text = fs.readFileSync(file).toString();
// console.log(text);
// https://stackoverflow.com/questions/52086611/regex-for-matching-js-import-statements
// https://regex101.com/r/FEN5ks/1
const regex = /import(?:(?:(?:[ \n\t]+([^ *\n\t\{\},]+)[ \n\t]*(?:,|[ \n\t]+))?([ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)|[ \n\t]*\*[ \n\t]*as[ \n\t]+([^ \n\t\{\}]+)[ \n\t]+)from[ \n\t]*(?:['"])(?:.\/)?([^'"\n]+)(['"])/gm;
const MODULE_PATH_GRP_IDX = 4;
// console.log(regex.test(text));
const matches = Array.from(text.matchAll(regex));
if (matches.length) {
  const depFile = changeExtension(file, '.d');
  const sourceDir = path.dirname(file);
  const buildDir = 'build/asc/';
  const wasmFile = changeExtension(file, '.wasm', buildDir);;
  const ostream = process.stdout;
  ostream.write(`${wasmFile} ${depFile}: ${file}`);
  const ASC_EXT = 'ts';
  for (const match of matches) {
    const moduleName = match[MODULE_PATH_GRP_IDX];
    const modulePath = path.join(sourceDir, `${moduleName}.${ASC_EXT}`)
    ostream.write(` ${modulePath}`);
  }
  ostream.end(EOL);
} else {
  // console.log('no imports found...');
}

// // the finish event is emitted when all data has been flushed from the stream
// writeStream.on('finish', () => {
//     console.log('wrote all data to file');
// });
