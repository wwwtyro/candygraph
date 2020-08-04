import { Regl, Buffer, DrawCommand } from "regl";
import { Primitive, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

type Options = {
  colors?: NumberArray | Dataset;
  scales?: NumberArray | Dataset;
  rotations?: number | NumberArray | Dataset;
};

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

export type Factory = ReturnType<typeof factory>;

export function factory(regl: Regl) {
  return function (
    shape: NumberArray | Dataset,
    xys: NumberArray | Dataset,
    options?: Options
  ): Shapes {
    return new Shapes(regl, shape, xys, options);
  };
}

export class Shapes extends Primitive {
  public shape: Dataset;
  public xys: Dataset;
  public scales: Dataset;
  public rotations: Dataset;
  public colors: Dataset;

  constructor(
    private regl: Regl,
    shape: NumberArray | Dataset,
    xys: NumberArray | Dataset,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.shape = createDataset(regl, shape);
    this.xys = createDataset(regl, xys);
    this.scales = createDataset(regl, opts.scales);
    this.rotations = createDataset(regl, opts.rotations);
    this.colors = createDataset(regl, opts.colors);
  }

  public command(glsl: string): DrawCommand {
    return this.regl({
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
          buffer: this.regl.prop<Props, "position">("position"),
          divisor: 0,
        },
        xy: {
          buffer: this.regl.prop<Props, "xy">("xy"),
          divisor: 1,
        },
        scale: {
          buffer: this.regl.prop<Props, "scale">("scale"),
          divisor: this.regl.prop<Props, "scaleDivisor">("scaleDivisor"),
        },
        rotation: {
          buffer: this.regl.prop<Props, "rotation">("rotation"),
          divisor: this.regl.prop<Props, "rotationDivisor">("rotationDivisor"),
        },
        color: {
          buffer: this.regl.prop<Props, "color">("color"),
          divisor: this.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
      },
      count: this.regl.prop<Props, "count">("count"),
      instances: this.regl.prop<Props, "instances">("instances"),
    });
  }

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

  public dispose(): void {
    this.xys.disposeIfAuto();
    this.shape.disposeIfAuto();
    this.scales.disposeIfAuto();
    this.rotations.disposeIfAuto();
    this.colors.disposeIfAuto();
  }
}
