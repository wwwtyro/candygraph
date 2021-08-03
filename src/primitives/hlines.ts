import { Regl, Buffer, DrawCommand } from "regl";
import { Primitive, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

type Options = {
  widths?: number | NumberArray | Dataset;
  colors?: NumberArray | Dataset;
};

const DEFAULT_OPTIONS = {
  widths: 1.0,
  colors: [0, 0, 0, 1],
};

type Props = {
  line: Buffer;
  color: Buffer;
  width: Buffer;
  colorDivisor: number;
  widthDivisor: number;
  instances: number;
};

export type Factory = ReturnType<typeof factory>;

export function factory(regl: Regl) {
  const segmentGeometry = regl.buffer([
    [0, -0.5],
    [1, -0.5],
    [1, +0.5],
    [0, -0.5],
    [1, +0.5],
    [0, +0.5],
  ]);

  return function createHLines(lines: NumberArray | Dataset, options?: Options) {
    return new HLines(regl, segmentGeometry, lines, options);
  };
}

export class HLines extends Primitive {
  public readonly lines: Dataset;
  public readonly widths: Dataset;
  public readonly colors: Dataset;

  constructor(
    private regl: Regl,
    private segmentGeometry: Buffer,
    lines: NumberArray | Dataset,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.lines = createDataset(regl, lines);
    this.widths = createDataset(regl, opts.widths);
    this.colors = createDataset(regl, opts.colors);
  }

  public command(glsl: string): DrawCommand {
    return this.regl({
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
            if (line.x > line.y) {
              ordered.xy = ordered.yx;
            }

            float w = max(1.0, round(width));

            vec2 p0 = toRange(ordered.xz);
            vec2 p1 = toRange(ordered.yz);

            p0.x = floor(p0.x);
            p1.x = ceil(p1.x);

            if (mod(w, 2.0) == 2.0) {
              p0.y = round(p0.y);
            } else {
              p0.y = floor(p0.y) + 0.5;
            }

            p1.y = p0.y;

            vec2 xBasis = vec2(p1.x - p0.x, 0.0);
            vec2 yBasis = vec2(0.0, 1.0);

            vec2 point = p0 + xBasis * position.x + yBasis * w * position.y;
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
          buffer: this.segmentGeometry,
          divisor: 0,
        },
        line: {
          buffer: this.regl.prop<Props, "line">("line"),
          divisor: 1,
        },
        color: {
          buffer: this.regl.prop<Props, "color">("color"),
          divisor: this.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
        width: {
          buffer: this.regl.prop<Props, "width">("width"),
          divisor: this.regl.prop<Props, "widthDivisor">("widthDivisor"),
        },
      },

      count: 6,
      instances: this.regl.prop<Props, "instances">("instances"),
    });
  }

  public render(command: DrawCommand): void {
    const { lines, colors, widths } = this;
    const instances = lines.count(3);
    command({
      instances,
      line: lines.buffer,
      color: colors.buffer,
      colorDivisor: colors.divisor(instances, 4),
      width: widths.buffer,
      widthDivisor: widths.divisor(instances, 1),
    });
  }

  public dispose(): void {
    this.lines.disposeIfAuto();
    this.colors.disposeIfAuto();
    this.widths.disposeIfAuto();
  }
}
