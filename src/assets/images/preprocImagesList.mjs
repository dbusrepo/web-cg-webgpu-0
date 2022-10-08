import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

// script to generate iamgesList.ts (for js/ts) and the asc file importImages.ts

const FIELD_SEP = '=';

// https://bobbyhadz.com/blog/javascript-dirname-is-not-defined-in-es-module-scope#:~:text=Conclusion%20%23,directory%20name%20of%20the%20path.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// console.log('directory-name 👉️', __dirname);

const srcFile = process.argv[2];
const outFile = process.argv[3];

const checkArgs = () => {
  const invMsg = `Syntax: node ${path.basename(__filename)} <srcFile> <outFile>`;
  if (srcFile == undefined) {
    console.log(`Invocation error: source file arg required.\n${invMsg}`);
    process.exit(1);
  }
  if (outFile == undefined) {
    console.log(`Invocation error: out file arg required.\n${invMsg}`);
    process.exit(1);
  }
};

checkArgs();

// example call from cli in the same dir of the script: 
// $ node preprocImagesList.mjs images.res imagesList.ts 
// if from another dir use the rel path for the script and the other args
const IN_FILE = srcFile; // path.join(__dirname, srcFile);
const OUT_FILE = outFile; // path.join(__dirname, outFile);
const OUT_FILE_ASC = '../engine/wasm/src/asc/importImages.ts';

const writeOpts = {
  encoding: 'utf8',
};

const warnMsg = '// Do not modify. This file is auto generated from images.res with make';
const getImagesUrlsPrefix = `const getImagesPaths = async () => {
  const paths = [`;
const getImagesUrlsSuffix = `  ];
  return (await Promise.all(paths)).map((imp) => imp.default);
};\n`;

const imagesObjPrefix = `const images = {`;
const imagesObjSuffix = `};\n`;

const ascImagesIndexesObjPrefix = `const ascImagesOffsetsImport = {`;
const ascImagesIndexesObjSuffix = `};\n`;

const suffix = 'export { images, getImagesPaths, ascImagesOffsetsImport };';

try {
  console.log(IN_FILE);
  const data = fs.readFileSync(IN_FILE, { encoding: 'utf8' });

  let objImagesBodyStr = '';
  let getImagesUrlsBodyStr = '';
  const lines = data.trimEnd().split(/\r?\n/); // trimeEnd removes the last newline
  console.log(lines);
  let first = true;
  let ascIndicesObjBodyStr = '';
  let ascIdx = 0;
  let ascImportBodyStr = '';
  lines.forEach(line => {
    if (line.trim() == '') return;
    const fields = line.split(FIELD_SEP);
    const [imgKey, imgFile] = fields;
    objImagesBodyStr += `${first ? '':'\n'}  ${imgKey}: '${imgFile}',`;
    const importStmt = ` import('./${imgFile}'),`;
    getImagesUrlsBodyStr += `${first ? '':'\n'}   ${importStmt}`;
    ascIndicesObjBodyStr += `${first ? '':'\n'}  ${imgKey}: ${ascIdx},`;
    ascIdx++;
    ascImportBodyStr += `export declare const ${imgKey}: u32;\n`;
    first = false;
  });
  console.log(objImagesBodyStr);
  const fileStr = `${warnMsg}
${getImagesUrlsPrefix}
${getImagesUrlsBodyStr}
${getImagesUrlsSuffix}
${imagesObjPrefix}
${objImagesBodyStr}
${imagesObjSuffix}
${ascImagesIndexesObjPrefix}
${ascIndicesObjBodyStr}
${ascImagesIndexesObjSuffix}
${suffix}
`;

  fs.writeFileSync(OUT_FILE, fileStr, writeOpts);
  fs.writeFileSync(OUT_FILE_ASC, ascImportBodyStr, writeOpts);
} catch (err) {
  console.error(err);
}
