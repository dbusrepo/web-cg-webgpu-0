import { FONT_SIZE, fontChars } from "../assets/fonts/font";

function writeFontCharsData(
  fontCharsView: Uint8Array,
) {
  let offset = 0;
  for (let ch of fontChars) {
    const chBitmap = new Uint8Array(ch);
    fontCharsView.set(chBitmap, offset);
    offset += chBitmap.byteLength;
  }
}

export {
  writeFontCharsData,
};
