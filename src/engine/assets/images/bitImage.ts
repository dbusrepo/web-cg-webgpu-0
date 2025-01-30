abstract class BitImage {
  protected width: number;
  protected height: number;
  protected buf8: Uint8Array;

  // constructor() {}

  get Width(): number {
    return this.width;
  }

  set Width(w: number) {
    this.width = w;
  }

  get Height(): number {
    return this.height;
  }

  set Height(h: number) {
    this.height = h;
  }

  get Buf8(): Uint8Array {
    return this.buf8;
  }

  set Buf8(p: Uint8Array) {
    this.buf8 = p;
  }
}

export { BitImage };
