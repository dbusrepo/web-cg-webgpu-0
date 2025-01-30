import { BitImageRGBA, BPP_RGBA } from './images/bitImageRgba';

function genNextMipLevelRGBA(curMip: BitImageRGBA): BitImageRGBA {
  const { Width: srcWidth, Height: srcHeight, Buf8: srcBuf8 } = curMip;
  const nextWidth = Math.max(1, srcWidth >> 1);
  const nextHeight = Math.max(1, srcHeight >> 1);
  const nextBuf8 = new Uint8Array(nextWidth * nextHeight * BPP_RGBA);

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  const mixPixels = (a: Uint8Array, b: Uint8Array, t: number): Uint8Array =>
    a.map((v, i) => lerp(v, b[i]!, t));

  const getSrcPixel = (x: number, y: number): Uint8Array => {
    const offset = (x + y * srcWidth) * BPP_RGBA;
    return srcBuf8.subarray(offset, offset + BPP_RGBA);
  };

  let dstOffset = 0;
  for (let y = 0; y < nextHeight; ++y) {
    for (let x = 0; x < nextWidth; ++x) {
      // texcoords of the center texel next mip
      const u = (x + 0.5) / nextWidth;
      const v = (y + 0.5) / nextHeight;
      // same texcoords in current mip - 0.5 for centering
      const au = u * srcWidth - 0.5;
      const av = v * srcHeight - 0.5;
      // src top left pixel
      const tx = Math.trunc(au);
      const ty = Math.trunc(av);
      // mix amounts between src pixels
      const t1 = au % 1;
      const t2 = av % 1;
      // get the 4 pixels
      const p00 = getSrcPixel(tx, ty);
      const p10 = getSrcPixel(tx + 1, ty);
      const p01 = getSrcPixel(tx, ty + 1);
      const p11 = getSrcPixel(tx + 1, ty + 1);
      // bilinear filtering
      // interpolate horizontally
      const p0 = mixPixels(p00, p10, t1);
      const p1 = mixPixels(p01, p11, t1);
      // interpolate vertically
      const p = mixPixels(p0, p1, t2);
      // write to next mip
      nextBuf8.set(p, dstOffset);
      dstOffset += BPP_RGBA;
    }
  }

  const nextMip = new BitImageRGBA();
  nextMip.init(nextWidth, nextHeight, nextBuf8);
  return nextMip;
}

interface AssetTextureRGBAParams {
  generateMipmaps: boolean;
  rotate: boolean;
}

class AssetTextureRGBA {
  private levels: BitImageRGBA[];

  constructor(image: BitImageRGBA, params: AssetTextureRGBAParams) {
    this.levels = [image];
    if (params.generateMipmaps) {
      this.generateMipmaps();
    }
    if (params.rotate) {
      for (const mipmap of this.levels) {
        AssetTextureRGBA.rotate90ccw(mipmap);
      }
    }
    for (const level of this.levels) {
      level.resizePitchToPow2();
    }
  }

  private static rotate90ccw(mipmap: BitImageRGBA): void {
    const { Width, Height } = mipmap;
    const dstBuf = new Uint8Array(Width * Height * BPP_RGBA);
    for (let y = 0; y < Height; ++y) {
      let srcOffset = y * Width * BPP_RGBA;
      for (let x = 0; x < Width; ++x) {
        const srcPixel = mipmap.Buf8.subarray(srcOffset, srcOffset + BPP_RGBA);
        const dstOffset = ((Width - x - 1) * Height + y) * BPP_RGBA;
        dstBuf.set(srcPixel, dstOffset);
        srcOffset += BPP_RGBA;
      }
    }
    mipmap.init(Height, Width, dstBuf);
  }

  get PixelsDataSize(): number {
    return this.levels.reduce((acc, cur) => acc + cur.Buf8.length, 0);
  }

  get Levels(): BitImageRGBA[] {
    return this.levels;
  }

  private generateMipmaps(): void {
    let mip = this.levels[0];
    if (!mip) {
      throw new Error('No base level to generate mipmaps from');
    }
    while (mip.Width > 1 || mip.Height > 1) {
      mip = genNextMipLevelRGBA(mip);
      this.levels.push(mip);
    }
  }
}

export { AssetTextureRGBA };
export type { AssetTextureRGBAParams };
