import { Regl, DrawCommand, Buffer } from "regl";
import { Primitive, Vector2, Vector4 } from "../common";
import { Font } from "./font";

export type Options = {
  align?: number;
  anchor?: Vector2;
  angle?: number;
  color?: Vector4;
  size?: number;
};

const DEFAULTS = {
  align: 0,
  anchor: [0, 0],
  angle: 0,
  color: [0, 0, 0, 1],
  size: 12,
};

type Props = {
  quad: Float32Array;
  uv: Float32Array;
  color: Vector4;
  offset: Vector2;
  size: number;
  angle: number;
  instances: number;
};

// Temp arrays that will be resized as needed and reused.
let quadBuffer = new Float32Array(1);
let uvBuffer = new Float32Array(1);

export type Factory = ReturnType<typeof factory>;

export function factory(regl: Regl) {
  const quadGeometry = regl.buffer([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);

  return function (
    font: Font,
    text: string,
    position: Vector2,
    options?: Options
  ) {
    return new Text(regl, quadGeometry, font, text, position, options);
  };
}

export class Text extends Primitive {
  public position: Vector2;
  public size: number;
  public angle: number;
  public color: Vector4;
  public readonly width: number;
  public readonly height: number;
  private quad: Buffer;
  private uv: Buffer;
  private instances: number;

  constructor(
    private regl: Regl,
    private quadGeometry: Buffer,
    private font: Font,
    text: string,
    position: Vector2,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULTS, ...options };

    // Get a count of the actual number of characters we'll be creating quads for.
    const charCount = text.replace(" ", "").replace("\n", "").length;

    // Keep track of the current character.
    let charIndex = 0;

    // Resize the temp buffers as needed.
    if (quadBuffer.length < charCount * 4) {
      quadBuffer = new Float32Array(charCount * 4);
      uvBuffer = new Float32Array(charCount * 4);
    }

    // We'll return the resulting data in this data structure.
    const quad = quadBuffer.subarray(0, charCount * 4);
    const uv = uvBuffer.subarray(0, charCount * 4);

    // Cursor x & y
    let cx = 0;
    let cy = 0;

    // Split the lines by newlines.
    const lines = text.split("\n");

    // We'll store the width and char count of each line in this.
    const textMetrics = [];

    // Iterate over each line.
    for (const line of lines) {
      const lineMetrics = {
        width: 0,
        chars: 0,
      };
      textMetrics.push(lineMetrics);

      // Keep track of the previous glyphs for kerning. Wipe it at the
      // beginning of each new line.
      let prevGlyph = null;

      // Iterate over each character of the line.
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        // for (const char of line) {
        // Find the glyph for that character.
        const glyph = this.font.glyphs[char.charCodeAt(0)];

        // If this isn't a space character, go ahead and append layout data.
        if (char !== " ") {
          // Calculate the amount to kern. Default to zero.
          const kernAmount =
            prevGlyph === null ? 0 : this.font.kern(prevGlyph.id, glyph.id);

          // Calculate and append the offset of the character quad.
          const ox = cx + glyph.xoffset + kernAmount;
          const oy = cy - (glyph.yoffset + glyph.height);
          quad[charIndex * 4 + 0] = ox;
          quad[charIndex * 4 + 1] = oy;

          // Calculate and append the width and height of the character quad.
          quad[charIndex * 4 + 2] = glyph.width;
          quad[charIndex * 4 + 3] = glyph.height;

          // Store the line width (so far).
          lineMetrics.width = ox + glyph.width;

          // Calculate and append the bottom-left and top-right UV coordinates of the character quad.
          uv[charIndex * 4 + 0] = glyph.uv[0];
          uv[charIndex * 4 + 1] = glyph.uv[1];
          uv[charIndex * 4 + 2] = glyph.uv[2];
          uv[charIndex * 4 + 3] = glyph.uv[3];

          // Increment stuff.
          charIndex++;
          lineMetrics.chars++;
        }

        // Advance the cursor horizontally and update the previous glyph.
        cx += glyph.xadvance;
        prevGlyph = glyph;
      }

      // Reset the cursor horizontally and advance the cursor vertically.
      cx = 0;
      cy -= this.font.lineHeight;
    }

    // Calculate the maximum extents of the text.
    const totalWidth = Math.max(...textMetrics.map((tm) => tm.width));
    const totalHeight = textMetrics.length * this.font.lineHeight;

    // Calculate an offset based on the text extents and the anchor position.
    const ox = -(0.5 * opts.anchor[0] + 0.5) * totalWidth;
    const oy = (0.5 * -opts.anchor[1] + 0.5) * totalHeight;

    // Iterate over each set of line data and shift the offsets according to the desired alignment.
    charIndex = 0;
    for (const lineMetrics of textMetrics) {
      const shift = (0.5 * opts.align + 0.5) * (totalWidth - lineMetrics.width);
      for (let i = 0; i < lineMetrics.chars; i++) {
        quad[charIndex * 4 + 0] += shift + ox;
        quad[charIndex * 4 + 1] += oy;
        charIndex++;
      }
    }

    this.quad = regl.buffer(quad);
    this.uv = regl.buffer(uv);
    this.instances = charCount;
    this.width = totalWidth;
    this.height = totalHeight;
    this.position = position.slice();
    this.size = opts.size;
    this.angle = opts.angle;
    this.color = opts.color.slice();
  }

  public command(glsl: string): DrawCommand {
    return this.regl({
      vert: `
        precision highp float;
        attribute vec2 position;
        attribute vec4 quad;
        attribute vec4 uv;

        uniform vec2 offset;
        uniform float angle;
        uniform float size;

        varying vec2 vUV;

        ${glsl}

        void main() {
          vec2 pos = quad.zw * position + quad.xy;
          vec2 rot = vec2(cos(angle), sin(angle));
          pos = vec2(
            rot.x * pos.x - rot.y * pos.y,
            rot.y * pos.x + rot.x * pos.y
          );
          pos = pos * size;
          pos = pos + toRange(offset);
          gl_Position = rangeToClip(pos);
          vUV = vec2(mix(uv.x, uv.z, position.x), mix(uv.y, uv.w, position.y));
        }
      `,
      frag: `
        #extension GL_OES_standard_derivatives : enable
        precision highp float;

        uniform sampler2D tSDF;
        uniform vec4 color;

        varying vec2 vUV;

        void main() {
          vec2 dFdxy = fwidth(vUV);
          const int samples = 4;
          vec2 stp = dFdxy / float(samples);
          vec2 start = vUV - 0.5 * dFdxy + 0.5 * stp;
          float alpha = 0.0;
          for (int x = 0; x < samples; x++) {
            for (int y = 0; y < samples; y++) {
              vec2 uv = start + vec2(float(x), float(y)) * stp;
              float d = texture2D(tSDF, uv).r;
              alpha += step(0.5, d);
            }
          }
          alpha /= float(samples * samples);
          alpha *= color.a;
          gl_FragColor = vec4(color.rgb * alpha, alpha);
        }
      `,
      attributes: {
        position: {
          buffer: this.quadGeometry,
          divisor: 0,
        },
        quad: {
          buffer: this.regl.prop<Props, "quad">("quad"),
          divisor: 1,
        },
        uv: {
          buffer: this.regl.prop<Props, "uv">("uv"),
          divisor: 1,
        },
      },
      uniforms: {
        tSDF: this.font.texture,
        offset: this.regl.prop<Props, "offset">("offset"),
        size: this.regl.prop<Props, "size">("size"),
        angle: this.regl.prop<Props, "angle">("angle"),
        color: this.regl.prop<Props, "color">("color"),
      },
      count: 6,
      instances: this.regl.prop<Props, "instances">("instances"),
    });
  }

  public render(command: DrawCommand): void {
    const { color, position, angle, size, quad, uv, instances } = this;
    command({
      color,
      offset: position,
      angle,
      size,
      quad: quad,
      uv: uv,
      instances: instances,
    });
  }

  public dispose(): void {
    this.quad.destroy();
    this.uv.destroy();
  }
}
