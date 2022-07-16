import { Buffer } from "regl";
import { CandyGraph } from "../candygraph";
import { NumberArray } from "../common";
import { Primitive, NamedDrawCommands } from "./primitive";
import { Dataset, createDataset } from "../dataset";

export interface LineSegmentsOptions {
  /** The width of the line segments in pixels. If this parameter is a single
   * number, it will apply to all line segments. Default 1. */
  widths?: number | NumberArray | Dataset;

  /** The color of the line segments. If this parameter is a single Vector4, it
   * will apply to all line segments. Default [0, 0, 0, 1]. */
  colors?: NumberArray | Dataset;
}

const DEFAULT_OPTIONS = {
  widths: 1,
  colors: [0, 0, 0, 1],
};

interface Props {
  position: Buffer;
  points: Buffer;
  instances: number;
  width: Buffer;
  color: Buffer;
  widthDivisor: number;
  colorDivisor: number;
}

export class LineSegments extends Primitive {
  public readonly points: Dataset;
  public readonly widths: Dataset;
  public readonly colors: Dataset;
  private segmentGeometry: Buffer;

  /**
   * @param points An array of points in the format `[x0, y0, x1, y1, ...]` that
   * represent the endpoints of the line segments to be rendered.
   */
  constructor(private cg: CandyGraph, points: NumberArray | Dataset, options: LineSegmentsOptions = {}) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.points = createDataset(cg, points);
    this.widths = createDataset(cg, opts.widths);
    this.colors = createDataset(cg, opts.colors);
    this.segmentGeometry = cg.regl.buffer([
      [0, -0.5],
      [1, -0.5],
      [1, +0.5],
      [0, -0.5],
      [1, +0.5],
      [0, +0.5],
    ]);
  }

  /** @internal */
  public commands(glsl: string): NamedDrawCommands {
    return {
      segments: this.cg.regl({
        vert: `
          precision highp float;
          attribute vec2 position, pointA, pointB;
          attribute float width;
          attribute vec4 color;

          varying vec4 vColor;

          ${glsl}

          void main() {
            // Transform points A and B to screen space.
            vec2 screenA = toRange(pointA);
            vec2 screenB = toRange(pointB);

            // Calculate the basis vectors for the line in screen space.
            vec2 xBasis = screenB - screenA;
            vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));

            // Determine the screen space point position and convert it back to clip space.
            vec2 point = screenA + xBasis * position.x + yBasis * width * position.y;
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
          pointA: {
            buffer: this.cg.regl.prop<Props, "points">("points"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 0,
            stride: Float32Array.BYTES_PER_ELEMENT * 4,
          },
          pointB: {
            buffer: this.cg.regl.prop<Props, "points">("points"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 2,
            stride: Float32Array.BYTES_PER_ELEMENT * 4,
          },
          width: {
            buffer: this.cg.regl.prop<Props, "width">("width"),
            divisor: this.cg.regl.prop<Props, "widthDivisor">("widthDivisor"),
          },
          color: {
            buffer: this.cg.regl.prop<Props, "color">("color"),
            divisor: this.cg.regl.prop<Props, "colorDivisor">("colorDivisor"),
          },
        },

        count: 6,
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
    };
  }

  /** @internal */
  public render(commands: NamedDrawCommands): void {
    const { points, colors, widths } = this;
    const instances = points.count(2) / 2;
    commands.segments({
      instances,
      position: this.segmentGeometry,
      points: points.buffer,
      color: colors.buffer,
      width: widths.buffer,
      colorDivisor: colors.divisor(instances, 4),
      widthDivisor: widths.divisor(instances, 1),
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.points.dispose();
    this.colors.dispose();
    this.widths.dispose();
    this.segmentGeometry.destroy();
  }
}
