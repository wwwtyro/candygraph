import { Regl, Buffer, DrawCommand } from "regl";
import { Primitive, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

type Options = {
  widths?: number | NumberArray | Dataset;
  colors?: NumberArray | Dataset;
};

const DEFAULT_OPTIONS = {
  widths: 1,
  colors: [0, 0, 0, 1],
};

type Props = {
  points: Buffer;
  instances: number;
  width: Buffer;
  color: Buffer;
  widthDivisor: number;
  colorDivisor: number;
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

  return function createLineSegments(points: NumberArray | Dataset, options?: Options) {
    return new LineSegments(regl, segmentGeometry, points, options);
  };
}

export class LineSegments extends Primitive {
  public readonly points: Dataset;
  public readonly widths: Dataset;
  public readonly colors: Dataset;

  constructor(
    private regl: Regl,
    private segmentGeometry: Buffer,
    points: NumberArray | Dataset,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.points = createDataset(regl, points);
    this.widths = createDataset(regl, opts.widths);
    this.colors = createDataset(regl, opts.colors);
  }

  public command(glsl: string): DrawCommand {
    return this.regl({
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
          buffer: this.segmentGeometry,
          divisor: 0,
        },
        pointA: {
          buffer: this.regl.prop<Props, "points">("points"),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        pointB: {
          buffer: this.regl.prop<Props, "points">("points"),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 2,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        width: {
          buffer: this.regl.prop<Props, "width">("width"),
          divisor: this.regl.prop<Props, "widthDivisor">("widthDivisor"),
        },
        color: {
          buffer: this.regl.prop<Props, "color">("color"),
          divisor: this.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
      },

      count: 6,
      instances: this.regl.prop<Props, "instances">("instances"),
    });
  }

  public render(command: DrawCommand): void {
    const { points, colors, widths } = this;
    const instances = points.count(2) / 2;
    command({
      instances,
      points: points.buffer,
      color: colors.buffer,
      width: widths.buffer,
      colorDivisor: colors.divisor(instances, 4),
      widthDivisor: widths.divisor(instances, 1),
    });
  }

  public dispose(): void {
    this.points.disposeIfAuto();
    this.colors.disposeIfAuto();
    this.widths.disposeIfAuto();
  }
}
