import { Buffer } from "regl";
import { CandyGraph } from "../candygraph";
import { NumberArray } from "../common";
import { Primitive, NamedDrawCommands } from "./primitive";
import { Dataset, createDataset } from "../dataset";

export interface ShapesOptions {
  /** The color of the shapes. If this value is a single Vector4, it will apply
   * to all the shapes. Default [0, 0, 0, 0.5]. */
  colors?: NumberArray | Dataset;
  /** The scale of the shapes. If this value is a single Vector2, it will apply
   * to all the shapes. Default [1, 1]. */
  scales?: NumberArray | Dataset;
  /** The rotation of the shapes in radians. If this value is a single float, it
   * will apply to all the shapes. Default 0. */
  rotations?: number | NumberArray | Dataset;
}

const DEFAULT_OPTIONS = {
  colors: [0, 0, 0, 0.5],
  scales: [1, 1],
  rotations: 0,
};

type Props = {
  position: Buffer;
  xs: Buffer;
  ys: Buffer;
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
export class Shapes extends Primitive {
  public shape: Dataset;
  public xs: Dataset;
  public ys: Dataset;
  public scales: Dataset;
  public rotations: Dataset;
  public colors: Dataset;

  /**
   * @param shape Set of 2D points in the form `[x0, y0, x1, y1, ...]` that
   * describe the (unindexed) set of triangles representing the shape to render.
   * @param xs The x coordinates of the shape positions in the form `[x0, x1,
   * ...]`.
   * @param ys The y coordinates of the shape positions in the form `[y0, y1,
   * ...]`.
   */
  constructor(
    private cg: CandyGraph,
    shape: NumberArray | Dataset,
    xs: NumberArray | Dataset,
    ys: NumberArray | Dataset,
    options: ShapesOptions = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.shape = createDataset(cg, shape);
    this.xs = createDataset(cg, xs);
    this.ys = createDataset(cg, ys);
    this.scales = createDataset(cg, opts.scales);
    this.rotations = createDataset(cg, opts.rotations);
    this.colors = createDataset(cg, opts.colors);
  }

  /** @internal */
  public commands(glsl: string): NamedDrawCommands {
    return {
      shapes: this.cg.regl({
        vert: `
          precision highp float;
          attribute vec2 position;
          attribute vec2 scale;
          attribute float xs, ys, rotation;
          attribute vec4 color;

          varying vec4 vColor;

          ${glsl}

          void main() {
            vec2 xy = vec2(xs, ys);
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
          xs: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
          },
          ys: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
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
      }),
    };
  }

  /** @internal */
  public render(commands: NamedDrawCommands): void {
    const { shape, xs, ys, scales, rotations, colors } = this;
    const instances = xs.count(1);
    commands.shapes({
      instances,
      xs: xs.buffer,
      ys: ys.buffer,
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
    this.xs.dispose();
    this.ys.dispose();
    this.shape.dispose();
    this.scales.dispose();
    this.rotations.dispose();
    this.colors.dispose();
  }
}
