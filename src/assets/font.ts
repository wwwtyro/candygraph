import { Texture } from "regl";
import { CandyGraph } from "../candygraph";
import { Vector2 } from "../common";

interface Glyph {
  id: number;
  xoffset: number;
  yoffset: number;
  width: number;
  height: number;
  xadvance: number;
  uv: Vector2;
}

/**
 * A `Font` is used in conjunction with the `Text` primitive to render text, such as axis labels.
 *
 * Font image and data files can be generated with `msdf-bmfont`:
 * ```sh
 * $ npm i -g msdf-bmfont-xml
 * $ msdf-bmfont -f json -s 24 -t sdf --smart-size Lato-Regular.ttf
 * ```
 */
export class Font {
  /** @internal */
  public readonly texture: Texture;

  /** @internal */
  public readonly lineHeight: number;

  /** @internal */
  public readonly glyphs: Glyph[] = [];

  private readonly kernTable: Int8Array;
  private readonly maxid: number;

  /**
   *
   * @param cg
   * @param image The image produced by msdf-bmfont.
   * @param json The json object produced by msdf-bmfont.
   */
  constructor(cg: CandyGraph, image: HTMLImageElement, json: any) {
    this.texture = cg.regl.texture({
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
      this.kernTable[kern.first * this.maxid + kern.second] = scale * kern.amount;
    }
  }

  /** @internal */
  public kern(first: number, second: number) {
    return this.kernTable[first * this.maxid + second];
  }

  /** Release all GPU resources and render this Font instance unusable. */
  public dispose() {
    this.texture.destroy();
  }
}
