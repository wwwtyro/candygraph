import { Buffer } from "regl";
import { CandyGraph } from "../candygraph";
import { NumberArray } from "../common";
import { Primitive, NamedDrawCommands } from "./primitive";
import { Dataset, createDataset } from "../dataset";

export interface InterleavedCirclesOptions {
  /** The interior color of the circles. If this value is a single Vector4, it will apply to all the circles. Default [0, 0, 0, 0.5]. */
  colors?: NumberArray | Dataset;
  /** The color of the borders. If this value is a single Vector4, it will apply to all the circles. Default [0, 0, 0, 1]. */
  borderColors?: NumberArray | Dataset;
  /** The radius of the circles (including border) in pixels. If this value is a single number, it will apply to all the circles. Default 10. */
  radii?: number | NumberArray | Dataset;
  /** The width of the borders in pixels. If this value is a single number, it will apply to all the borders. Default 3. */
  borderWidths?: number | NumberArray | Dataset;
}

const DEFAULT_OPTIONS = {
  colors: [0, 0, 0, 0.5],
  radii: 10,
  borderWidths: 3,
  borderColors: [0, 0, 0, 1],
};

type Props = {
  position: Buffer;
  offset: Buffer;
  color: Buffer;
  radius: Buffer;
  borderWidth: Buffer;
  borderColor: Buffer;
  colorDivisor: number;
  radiusDivisor: number;
  borderWidthDivisor: number;
  borderColorDivisor: number;
  instances: number;
};

/** Colored circles with optional borders. */
export class InterleavedCircles extends Primitive {
  public readonly xys: Dataset;
  public readonly colors: Dataset;
  public readonly radii: Dataset;
  public readonly borderWidths: Dataset;
  public readonly borderColors: Dataset;
  private positionBuffer: Buffer;

  /**
   * @param xys The x and y coordinates of the circle centers in the form `[x0, y0, x1, y1, ...]`.
   */
  constructor(private cg: CandyGraph, xys: NumberArray | Dataset, options: InterleavedCirclesOptions = {}) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.xys = createDataset(cg, xys);
    this.colors = createDataset(cg, opts.colors);
    this.radii = createDataset(cg, opts.radii);
    this.borderWidths = createDataset(cg, opts.borderWidths);
    this.borderColors = createDataset(cg, opts.borderColors);
    this.positionBuffer = cg.regl.buffer([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);
  }

  /** @internal */
  public commands(glsl: string): NamedDrawCommands {
    return {
      circles: this.cg.regl({
        vert: `
          precision highp float;
          attribute vec2 position;
          attribute vec2 offset;
          attribute vec4 color;
          attribute vec4 borderColor;
          attribute float radius;
          attribute float borderWidth;

          varying vec4 vColor;
          varying vec4 vBorderColor;
          varying vec2 vPosition;
          varying float vRadius;
          varying float vBorderWidth;

          ${glsl}

          void main() {
            vPosition = position * radius;
            vec2 screenPosition = toRange(offset) + vPosition;
            gl_Position = rangeToClip(screenPosition);
            vColor = color;
            vBorderColor = borderColor;
            vRadius = radius;
            vBorderWidth = borderWidth;
          }`,

        frag: `
          precision highp float;

          uniform vec2 resolution;

          varying vec4 vBorderColor;
          varying vec4 vColor;
          varying vec2 vPosition;
          varying float vRadius;
          varying float vBorderWidth;

          vec4 sample(float d2, float r2, float bi2) {
            if (d2 > r2) {
              if (vBorderWidth > 0.0) {
                return vec4(vBorderColor.rgb, 0.0);
              }
              return vec4(vColor.rgb, 0.0);
            }
            if (d2 > bi2) {
              return vBorderColor;
            } else {
              return vColor;
            }
          }

          void main() {
            vec2 p1 = vPosition + vec2(-0.25, +0.35);
            vec2 p2 = vPosition + vec2(+0.35, +0.25);
            vec2 p3 = vPosition + vec2(+0.25, -0.35);
            vec2 p4 = vPosition + vec2(-0.35, -0.25);
            float d1 = dot(p1, p1);
            float d2 = dot(p2, p2);
            float d3 = dot(p3, p3);
            float d4 = dot(p4, p4);
            float r2 = vRadius * vRadius;
            float bi2 = vRadius - vBorderWidth;
            bi2 *= bi2;
            vec4 pc = vec4(0.0);
            pc += sample(d1, r2, bi2);
            pc += sample(d2, r2, bi2);
            pc += sample(d3, r2, bi2);
            pc += sample(d4, r2, bi2);
            if (pc.a == 0.0) {
              discard;
            }
            gl_FragColor = 0.25 * pc;
          }`,

        attributes: {
          position: {
            buffer: this.cg.regl.prop<Props, "position">("position"),
            divisor: 0,
          },
          offset: {
            buffer: this.cg.regl.prop<Props, "offset">("offset"),
            divisor: 1,
          },
          color: {
            buffer: this.cg.regl.prop<Props, "color">("color"),
            divisor: this.cg.regl.prop<Props, "colorDivisor">("colorDivisor"),
          },
          radius: {
            buffer: this.cg.regl.prop<Props, "radius">("radius"),
            divisor: this.cg.regl.prop<Props, "radiusDivisor">("radiusDivisor"),
          },
          borderWidth: {
            buffer: this.cg.regl.prop<Props, "borderWidth">("borderWidth"),
            divisor: this.cg.regl.prop<Props, "borderWidthDivisor">("borderWidthDivisor"),
          },
          borderColor: {
            buffer: this.cg.regl.prop<Props, "borderColor">("borderColor"),
            divisor: this.cg.regl.prop<Props, "borderColorDivisor">("borderColorDivisor"),
          },
        },
        count: 6,
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
    };
  }

  /** @internal */
  public render(commands: NamedDrawCommands): void {
    const { xys, colors, radii, borderWidths, borderColors } = this;
    const instances = xys.count(2);
    commands.circles({
      instances,
      position: this.positionBuffer,
      offset: xys.buffer,
      color: colors.buffer,
      radius: radii.buffer,
      borderWidth: borderWidths.buffer,
      borderColor: borderColors.buffer,
      colorDivisor: colors.divisor(instances, 4),
      radiusDivisor: radii.divisor(instances, 1),
      borderWidthDivisor: borderWidths.divisor(instances, 1),
      borderColorDivisor: borderColors.divisor(instances, 4),
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.xys.dispose();
    this.radii.dispose();
    this.borderWidths.dispose();
    this.colors.dispose();
    this.borderColors.dispose();
    this.positionBuffer.destroy();
  }
}
