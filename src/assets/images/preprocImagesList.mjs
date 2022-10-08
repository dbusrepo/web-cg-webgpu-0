import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

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
const suffix = 'export { images, getImagesPaths };';

try {
  console.log(IN_FILE);
  const data = fs.readFileSync(IN_FILE, { encoding: 'utf8' });

  let objBodyStr = '';
  let getImagesUrlsBodyStr = '';
  const lines = data.trimEnd().split(/\r?\n/); // trimeEnd removes the last newline
  console.log(lines);
  let first = true;
  lines.forEach(line => {
    if (line.trim() == '') return;
    const fields = line.split(FIELD_SEP);
    const [imgKey, imgFile] = fields;
    objBodyStr += `${first ? '':'\n'}  ${imgKey}: '${imgFile}',`;
    const importStmt = ` import('./${imgFile}'),`;
    getImagesUrlsBodyStr += `${first ? '':'\n'}   ${importStmt}`;
    first = false;
  });
  console.log(objBodyStr);
  const fileStr = `${warnMsg}
${getImagesUrlsPrefix}
${getImagesUrlsBodyStr}
${getImagesUrlsSuffix}
${imagesObjPrefix}
${objBodyStr}
${imagesObjSuffix}
${suffix}
`;

  fs.writeFileSync(OUT_FILE, fileStr, writeOpts);
} catch (err) {
  console.error(err);
}
