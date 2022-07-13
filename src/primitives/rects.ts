import { Buffer, DrawCommand } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

type Options = {
  colors?: NumberArray | Dataset;
};

const DEFAULT_OPTIONS = {
  colors: [0, 0, 0, 0.5],
};

type Props = {
  position: Buffer;
  rect: Buffer;
  color: Buffer;
  colorDivisor: number;
  instances: number;
};

export class Rects extends Primitive {
  public readonly rects: Dataset;
  public readonly colors: Dataset;
  private positionBuffer: Buffer;

  constructor(private cg: CandyGraph, rects: NumberArray | Dataset, options: Options = {}) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.rects = createDataset(cg, rects);
    this.colors = createDataset(cg, opts.colors);
    this.positionBuffer = cg.regl.buffer([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
  }

  public command(glsl: string): DrawCommand {
    return this.cg.regl({
      vert: `
          precision highp float;
          attribute vec2 position;
          attribute vec4 rect;
          attribute vec4 color;

          varying vec4 vColor;

          ${glsl}

          void main() {
            gl_Position = domainToClip(rect.xy + position.xy * rect.zw);
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
        rect: {
          buffer: this.cg.regl.prop<Props, "rect">("rect"),
          divisor: 1,
        },
        color: {
          buffer: this.cg.regl.prop<Props, "color">("color"),
          divisor: this.cg.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
      },
      count: 6,
      instances: this.cg.regl.prop<Props, "instances">("instances"),
    });
  }

  public render(command: DrawCommand): void {
    const { rects, colors } = this;
    const instances = rects.count(4);
    command({
      instances,
      position: this.positionBuffer,
      rect: rects.buffer,
      color: colors.buffer,
      colorDivisor: colors.divisor(instances, 4),
    });
  }

  public dispose(): void {
    this.rects.dispose();
    this.colors.dispose();
    this.positionBuffer.destroy();
  }
}
