import { Buffer } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, NumberArray, NamedDrawCommands } from "../common";
import { Dataset, createDataset } from "../dataset";

export interface RectsOptions {
  /** The color of the rectangles. If this value is a single Vector4, it will apply to all the rectangles. Default [0, 0, 0, 0.5]. */
  colors?: NumberArray | Dataset;
}

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

  /**
   * @param rects The x, y position of the lower-left corner of the rectangle
   * and its width and height in the form `[x0, y0, w0, h0, x1, y1, w1, h1, ...]`.
   */
  constructor(private cg: CandyGraph, rects: NumberArray | Dataset, options: RectsOptions = {}) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.rects = createDataset(cg, rects);
    this.colors = createDataset(cg, opts.colors);
    this.positionBuffer = cg.regl.buffer([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
  }

  /** @internal */
  public commands(glsl: string): NamedDrawCommands {
    return {
      rects: this.cg.regl({
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
      }),
    };
  }

  /** @internal */
  public render(commands: NamedDrawCommands): void {
    const { rects, colors } = this;
    const instances = rects.count(4);
    commands.rects({
      instances,
      position: this.positionBuffer,
      rect: rects.buffer,
      color: colors.buffer,
      colorDivisor: colors.divisor(instances, 4),
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.rects.dispose();
    this.colors.dispose();
    this.positionBuffer.destroy();
  }
}
