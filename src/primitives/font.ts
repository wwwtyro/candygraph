import { Regl, Texture } from "regl";
import { CandyGraph } from "../candygraph";
import { Vector2 } from "../common";

type Glyph = {
  id: number;
  xoffset: number;
  yoffset: number;
  width: number;
  height: number;
  xadvance: number;
  uv: Vector2;
};

export function createFont(
  cg: CandyGraph,
  image: HTMLImageElement,
  json: any
) {
  return new Font(cg.regl, image, json);
}

export class Font {
  public readonly texture: Texture;
  public readonly lineHeight: number;
  public readonly glyphs: Glyph[] = [];
  private readonly kernTable: Int8Array;
  private readonly maxid: number;

  constructor(regl: Regl, image: HTMLImageElement, json: any) {
    this.texture = regl.texture({
      data: image,
      mag: "linear",
      min: "linear",
      flipY: true,
    });

    const scale = 1.0 / json.info.size;

    this.lineHeight = scale * json.common.lineHeight;

    const { scaleW, scaleH } = json.common;
    for (const char of json.chars) {
      this.glyphs[char.id as number] = {
        id: char.id as number,
        xoffset: scale * (char.xoffset as number),
        yoffset: scale * (char.yoffset as number),
        width: scale * (char.width as number),
        height: scale * (char.height as number),
        xadvance: scale * (char.xadvance as number),
        // Original image is flipped, and the original coordinates are from
        // top left to bottom right, so we need to flip the y-coordinates (1 - y)
        // AND swap their order (y0, y1 = y1, y0) to make things line up normally
        // in webgl-land.
        uv: [
          (char.x as number) / scaleW,
          1.0 - ((char.y as number) + (char.height as number)) / scaleH,
          ((char.x as number) + (char.width as number)) / scaleW,
          1.0 - (char.y as number) / scaleH,
        ],
      };
    }

    // Create the kerning table for quick lookups.
    this.maxid = this.glyphs.length;
    this.kernTable = new Int8Array(this.maxid * this.maxid);
    for (const kern of json.kernings) {
      this.kernTable[kern.first * this.maxid + kern.second] =
        scale * kern.amount;
    }
  }

  public kern(first: number, second: number) {
    return this.kernTable[first * this.maxid + second];
  }
}
