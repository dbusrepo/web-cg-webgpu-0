// eslint-disable-next-line import/no-nodejs-modules, unicorn/prefer-node-protocol
import assert from 'assert';
import { FONT_X_SIZE, fontChars } from '../../../assets/fonts/font';

function copyFontChars2WasmMem(fontCharsView: Uint8Array): void {
  assert(FONT_X_SIZE === 8);
  let offset = 0;
  for (const ch of fontChars) {
    const chBitmap = new Uint8Array(ch);
    fontCharsView.set(chBitmap, offset);
    offset += chBitmap.byteLength;
  }
}

export { copyFontChars2WasmMem };
