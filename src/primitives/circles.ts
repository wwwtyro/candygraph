import { Buffer, DrawCommand } from "regl";
import { CandyGraph } from "../candygraph";
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
  offsetX: Buffer;
  offsetY: Buffer;
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

function getPositionBuffer(cg: CandyGraph) {
  if (!cg.hasPositionBuffer("circles")) {
    cg.setPositionBuffer(
      "circles",
      // prettier-ignore
      [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]
    );
  }
  return cg.getPositionBuffer("circles");
}

export function createCircles(cg: CandyGraph, xs: NumberArray | Dataset, ys: NumberArray | Dataset, options?: Options) {
  const positionBuffer = getPositionBuffer(cg)!;
  return new Circles(cg, positionBuffer, xs, ys, options);
}

export class Circles extends Primitive {
  public readonly xs: Dataset;
  public readonly ys: Dataset;
  public readonly colors: Dataset;
  public readonly radii: Dataset;
  public readonly borderWidths: Dataset;
  public readonly borderColors: Dataset;

  constructor(
    private cg: CandyGraph,
    private positionBuffer: Buffer,
    xs: NumberArray | Dataset,
    ys: NumberArray | Dataset,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.xs = createDataset(cg.regl, xs);
    this.ys = createDataset(cg.regl, ys);
    this.colors = createDataset(cg.regl, opts.colors);
    this.radii = createDataset(cg.regl, opts.radii);
    this.borderWidths = createDataset(cg.regl, opts.borderWidths);
    this.borderColors = createDataset(cg.regl, opts.borderColors);
  }

  public command(glsl: string): DrawCommand {
    return this.cg.regl({
      vert: `
          precision highp float;
          attribute vec2 position;
          attribute float offsetX, offsetY;
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
            vec2 offset = vec2(offsetX, offsetY);
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
        offsetX: {
          buffer: this.cg.regl.prop<Props, "offsetX">("offsetX"),
          divisor: 1,
        },
        offsetY: {
          buffer: this.cg.regl.prop<Props, "offsetY">("offsetY"),
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
    });
  }

  public render(command: DrawCommand): void {
    const { xs, ys, colors, radii, borderWidths, borderColors } = this;
    const instances = xs.count(1);
    command({
      instances,
      offsetX: xs.buffer,
      offsetY: ys.buffer,
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
    this.xs.dispose();
    this.ys.dispose();
    this.radii.dispose();
    this.borderWidths.dispose();
    this.colors.dispose();
    this.borderColors.dispose();
    this.cg.clearCommandCache(this);
  }
}
