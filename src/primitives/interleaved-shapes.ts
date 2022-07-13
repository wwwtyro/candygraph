import { Buffer, DrawCommand } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

export interface InterleavedShapesOptions {
  /** The color of the shapes. If this value is a single Vector4, it will apply to all the shapes. Default [0, 0, 0, 0.5]. */
  colors?: NumberArray | Dataset;

  /** The scale of the shapes. If this value is a single Vector2, it will apply to all the shapes. Default [1, 1]. */
  scales?: NumberArray | Dataset;

  /** The rotation of the shapes in radians. If this value is a single float, it will apply to all the shapes. Default 0. */
  rotations?: number | NumberArray | Dataset;
}

const DEFAULT_OPTIONS = {
  colors: [0, 0, 0, 0.5],
  scales: [1, 1],
  rotations: 0,
};

type Props = {
  position: Buffer;
  xy: Buffer;
  scale: Buffer;
  rotation: Buffer;
  color: Buffer;
  positionDivisor: number;
  scaleDivisor: number;
  rotationDivisor: number;
  colorDivisor: number;
  count: number;
  instances: number;
};

/** Renders colored shapes. Useful for custom trace points. */
export class InterleavedShapes extends Primitive {
  public shape: Dataset;
  public xys: Dataset;
  public scales: Dataset;
  public rotations: Dataset;
  public colors: Dataset;

  /**
   * @param shape Set of 2D points in the form `[x0, y0, x1, y1, ...]` that describe the (unindexed) set of triangles representing the shape to render.
   * @param xys The x, y coordinates of the shape positions in the form `[x0, y0, x1, y1, ...]`.
   */
  constructor(
    private cg: CandyGraph,
    shape: NumberArray | Dataset,
    xys: NumberArray | Dataset,
    options: InterleavedShapesOptions = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.shape = createDataset(cg, shape);
    this.xys = createDataset(cg, xys);
    this.scales = createDataset(cg, opts.scales);
    this.rotations = createDataset(cg, opts.rotations);
    this.colors = createDataset(cg, opts.colors);
  }

  /** @internal */
  public command(glsl: string): DrawCommand {
    return this.cg.regl({
      vert: `
          precision highp float;
          attribute vec2 position;
          attribute vec2 xy, scale;
          attribute float rotation;
          attribute vec4 color;

          varying vec4 vColor;

          ${glsl}

          void main() {
            vec2 pos = scale * position;
            float sint = sin(rotation);
            float cost = cos(rotation);
            pos = vec2(
              cost * pos.x - sint * pos.y,
              sint * pos.x + cost * pos.y
            );
            vec2 screenPosition = toRange(xy) + pos;
            gl_Position = rangeToClip(screenPosition);
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
        xy: {
          buffer: this.cg.regl.prop<Props, "xy">("xy"),
          divisor: 1,
        },
        scale: {
          buffer: this.cg.regl.prop<Props, "scale">("scale"),
          divisor: this.cg.regl.prop<Props, "scaleDivisor">("scaleDivisor"),
        },
        rotation: {
          buffer: this.cg.regl.prop<Props, "rotation">("rotation"),
          divisor: this.cg.regl.prop<Props, "rotationDivisor">("rotationDivisor"),
        },
        color: {
          buffer: this.cg.regl.prop<Props, "color">("color"),
          divisor: this.cg.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
      },
      count: this.cg.regl.prop<Props, "count">("count"),
      instances: this.cg.regl.prop<Props, "instances">("instances"),
    });
  }

  /** @internal */
  public render(command: DrawCommand): void {
    const { shape, xys, scales, rotations, colors } = this;
    const instances = xys.count(2);
    command({
      instances,
      xy: xys.buffer,
      position: shape.buffer,
      scale: scales.buffer,
      rotation: rotations.buffer,
      color: colors.buffer,
      scaleDivisor: scales.divisor(instances, 2),
      rotationDivisor: rotations.divisor(instances, 1),
      colorDivisor: colors.divisor(instances, 4),
      count: shape.count(2),
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.xys.dispose();
    this.shape.dispose();
    this.scales.dispose();
    this.rotations.dispose();
    this.colors.dispose();
  }
}
