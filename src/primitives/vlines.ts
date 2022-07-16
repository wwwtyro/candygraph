import { Buffer } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, NumberArray, NamedDrawCommands } from "../common";
import { Dataset, createDataset } from "../dataset";

export interface VLinesOptions {
  /** The width of the lines in pixels. If this value is a single number, it will apply to all the lines. Default 1. */
  widths?: number | NumberArray | Dataset;
  /** The color of the lines. If this value is a single Vector4, it will apply to all the lines. Default [0, 0, 0, 1] */
  colors?: NumberArray | Dataset;
}

const DEFAULT_OPTIONS = {
  widths: 1.0,
  colors: [0, 0, 0, 1],
};

type Props = {
  position: Buffer;
  line: Buffer;
  color: Buffer;
  width: Buffer;
  colorDivisor: number;
  widthDivisor: number;
  instances: number;
};

/**
 * Renders clean vertical lines. Line widths are rounded to the nearest pixel
 * (with a minimum of 1) so that the lines never appear blurry. This is useful
 * when rendering items like orthographic axes; without this approach, axis
 * lines or tick marks can consume different numbers of pixels and result in an
 * inconsistent appearance.
 */
export class VLines extends Primitive {
  public readonly lines: Dataset;
  public readonly widths: Dataset;
  public readonly colors: Dataset;
  private segmentGeometry: Buffer;

  /**
   * @param lines The line positions in the form `[x0, y0_0, y0_1, x1, y1_0,
   * y1_1, ...]` where each line is defined by three numbers.
   */
  constructor(private cg: CandyGraph, lines: NumberArray | Dataset, options: VLinesOptions = {}) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.lines = createDataset(cg, lines);
    this.widths = createDataset(cg, opts.widths);
    this.colors = createDataset(cg, opts.colors);
    this.segmentGeometry = cg.regl.buffer([
      [-0.5, 0],
      [+0.5, 0],
      [+0.5, 1],
      [-0.5, 0],
      [+0.5, 1],
      [-0.5, 1],
    ]);
  }

  /** @internal */
  public commands(glsl: string): NamedDrawCommands {
    return {
      vlines: this.cg.regl({
        vert: `
          precision highp float;
          attribute vec2 position;
          attribute vec3 line;
          attribute float width;
          attribute vec4 color;

          varying vec4 vColor;

          ${glsl}

          float round(float v) {
            return floor(v) + floor(2.0 * fract(v));
          }

          void main() {
            vec3 ordered = line;
            if (line.y > line.z) {
              ordered.yz = ordered.zy;
            }

            float w = max(1.0, round(width));

            vec2 p0 = toRange(ordered.xy);
            vec2 p1 = toRange(ordered.xz);

            p0.y = floor(p0.y);
            p1.y = ceil(p1.y);

            if (mod(w, 2.0) == 2.0) {
              p0.x = round(p0.x);
            } else {
              p0.x = floor(p0.x) + 0.5;
            }

            p1.x = p0.x;

            vec2 xBasis = vec2(1, 0.0);
            vec2 yBasis = vec2(0.0, p1.y - p0.y);

            vec2 point = p0 + yBasis * position.y + xBasis * w * position.x;
            gl_Position = rangeToClip(point);

            vColor = color;
          }`,

        frag: `
          precision highp float;
          varying vec4 vColor;

          void main() {
            gl_FragColor = vColor;
          }`,

        attributes: {
          position: {
            buffer: this.cg.regl.prop<Props, "position">("position"),
            divisor: 0,
          },
          line: {
            buffer: this.cg.regl.prop<Props, "line">("line"),
            divisor: 1,
          },
          color: {
            buffer: this.cg.regl.prop<Props, "color">("color"),
            divisor: this.cg.regl.prop<Props, "colorDivisor">("colorDivisor"),
          },
          width: {
            buffer: this.cg.regl.prop<Props, "width">("width"),
            divisor: this.cg.regl.prop<Props, "widthDivisor">("widthDivisor"),
          },
        },

        count: 6,
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
    };
  }

  /** @internal */
  public render(commands: NamedDrawCommands): void {
    const { lines, colors, widths } = this;
    const instances = lines.count(3);
    commands.vlines({
      instances,
      position: this.segmentGeometry,
      line: lines.buffer,
      color: colors.buffer,
      width: widths.buffer,
      colorDivisor: colors.divisor(instances, 4),
      widthDivisor: widths.divisor(instances, 1),
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.lines.dispose();
    this.colors.dispose();
    this.widths.dispose();
    this.segmentGeometry.destroy();
  }
}
