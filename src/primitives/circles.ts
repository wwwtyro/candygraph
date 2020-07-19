import { Regl, Buffer, DrawCommand } from "regl";
import { Primitive, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

type Options = {
  colors?: NumberArray | Dataset;
  borderColors?: NumberArray | Dataset;
  radii?: number | NumberArray | Dataset;
  borderWidths?: number | NumberArray | Dataset;
};

const DEFAULT_OPTIONS = {
  colors: [0, 0, 0, 0.5],
  radii: 10,
  borderWidths: 3,
  borderColors: [0, 0, 0, 1],
};

type Props = {
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

export type Factory = ReturnType<typeof factory>;

export function factory(regl: Regl) {
  // prettier-ignore
  const positionBuffer = regl.buffer([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);
  return function (positions: NumberArray | Dataset, options?: Options) {
    return new Circles(regl, positionBuffer, positions, options);
  };
}

export class Circles extends Primitive {
  public readonly positions: Dataset;
  public readonly colors: Dataset;
  public readonly radii: Dataset;
  public readonly borderWidths: Dataset;
  public readonly borderColors: Dataset;

  constructor(
    private regl: Regl,
    private positionBuffer: Buffer,
    positions: NumberArray | Dataset,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.positions = createDataset(regl, positions);
    this.colors = createDataset(regl, opts.colors);
    this.radii = createDataset(regl, opts.radii);
    this.borderWidths = createDataset(regl, opts.borderWidths);
    this.borderColors = createDataset(regl, opts.borderColors);
  }

  public command(glsl: string): DrawCommand {
    return this.regl({
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
          buffer: this.positionBuffer,
          divisor: 0,
        },
        offset: {
          buffer: this.regl.prop<Props, "offset">("offset"),
          divisor: 1,
        },
        color: {
          buffer: this.regl.prop<Props, "color">("color"),
          divisor: this.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
        radius: {
          buffer: this.regl.prop<Props, "radius">("radius"),
          divisor: this.regl.prop<Props, "radiusDivisor">("radiusDivisor"),
        },
        borderWidth: {
          buffer: this.regl.prop<Props, "borderWidth">("borderWidth"),
          divisor: this.regl.prop<Props, "borderWidthDivisor">(
            "borderWidthDivisor"
          ),
        },
        borderColor: {
          buffer: this.regl.prop<Props, "borderColor">("borderColor"),
          divisor: this.regl.prop<Props, "borderColorDivisor">(
            "borderColorDivisor"
          ),
        },
      },
      count: 6,
      instances: this.regl.prop<Props, "instances">("instances"),
    });
  }

  public render(command: DrawCommand): void {
    const { positions, colors, radii, borderWidths, borderColors } = this;
    const instances = positions.count(2);
    command({
      instances,
      offset: positions.buffer,
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

  public dispose(): void {
    this.positions.disposeIfAuto();
    this.radii.disposeIfAuto();
    this.borderWidths.disposeIfAuto();
    this.colors.disposeIfAuto();
    this.borderColors.disposeIfAuto();
  }
}
