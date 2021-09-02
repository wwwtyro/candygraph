import { Regl, Buffer, DrawCommand } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

type Options = {
  colors?: NumberArray | Dataset;
  radii?: number | NumberArray | Dataset;
};

const DEFAULT_OPTIONS = {
  colors: [0, 0, 0, 0.5],
  radii: 10,
};

type Props = {
  offset: Buffer;
  angle: Buffer;
  radius: Buffer;
  color: Buffer;
  colorDivisor: number;
  radiusDivisor: number;
  angleDivisor: number;
  instances: number;
};

function getPositionBuffer(cg: CandyGraph) {
  if (!cg.hasPositionBuffer('wedges')) {
    cg.setPositionBuffer(
      'wedges',
      // prettier-ignore
      [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]
    );
  }
  return cg.getPositionBuffer('wedges');
}

export function createWedges(
  cg: CandyGraph,
  xys: NumberArray | Dataset,
  angles: NumberArray | Dataset,
  options?: Options
) {
  const positionBuffer = getPositionBuffer(cg)!;
  return new Wedges(cg.regl, positionBuffer, xys, angles, options);
}

export class Wedges extends Primitive {
  public readonly xys: Dataset;
  public readonly angles: Dataset;
  public readonly colors: Dataset;
  public readonly radii: Dataset;

  constructor(
    private regl: Regl,
    private positionBuffer: Buffer,
    xys: NumberArray | Dataset,
    angles: NumberArray | Dataset,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.xys = createDataset(regl, xys);
    this.angles = createDataset(regl, angles);
    this.colors = createDataset(regl, opts.colors);
    this.radii = createDataset(regl, opts.radii);
  }

  public command(glsl: string): DrawCommand {
    return this.regl({
      vert: `
          precision highp float;
          attribute vec2 position;
          attribute vec2 offset, angle;
          attribute vec4 color;
          attribute float radius;

          varying vec4 vColor;
          varying vec2 vPosition, vAngle;
          varying float vRadius;

          ${glsl}

          void main() {
            vPosition = position * radius;
            vec2 screenPosition = toRange(offset) + vPosition;
            gl_Position = rangeToClip(screenPosition);
            vColor = color;
            vRadius = radius;
            vAngle = angle;
          }`,

      frag: `
          precision highp float;

          uniform vec2 resolution;

          varying vec4 vColor;
          varying vec2 vPosition, vAngle;
          varying float vRadius;

          const float PI = 3.141592653589793;

          vec4 sample(vec2 p) {
            float dist2 = dot(p, p);
            if (dist2 > vRadius * vRadius) {
              return vec4(vColor.rgb, 0.0);
            }
            float theta;
            if (p.x == 0.0) {
              if (p.y > 0.0) {
                theta = 0.5 * PI;
              } else {
                theta = 1.5 * PI;
              }
            } else {
              theta = atan(p.y, p.x);
              if (theta < 0.0) {
                theta += 2.0 * PI;
              }
            }
            if (theta < vAngle.x || theta > vAngle.x + vAngle.y) {
              return vec4(vColor.rgb, 0.0);
            }
            return vColor;
          }

          void main() {
            vec2 p1 = vPosition + vec2(-0.25, +0.35);
            vec2 p2 = vPosition + vec2(+0.35, +0.25);
            vec2 p3 = vPosition + vec2(+0.25, -0.35);
            vec2 p4 = vPosition + vec2(-0.35, -0.25);
            vec4 pc = vec4(0.0);
            pc += sample(p1);
            pc += sample(p2);
            pc += sample(p3);
            pc += sample(p4);
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
        angle: {
          buffer: this.regl.prop<Props, "angle">("angle"),
          divisor: this.regl.prop<Props, "angleDivisor">("angleDivisor"),
        },
        color: {
          buffer: this.regl.prop<Props, "color">("color"),
          divisor: this.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
        radius: {
          buffer: this.regl.prop<Props, "radius">("radius"),
          divisor: this.regl.prop<Props, "radiusDivisor">("radiusDivisor"),
        },
      },
      count: 6,
      instances: this.regl.prop<Props, "instances">("instances"),
    });
  }

  public render(command: DrawCommand): void {
    const { xys, angles, colors, radii } = this;
    const instances = xys.count(2);
    command({
      instances,
      offset: xys.buffer,
      angle: angles.buffer,
      color: colors.buffer,
      radius: radii.buffer,
      angleDivisor: angles.divisor(instances, 2),
      colorDivisor: colors.divisor(instances, 4),
      radiusDivisor: radii.divisor(instances, 1),
    });
  }

  public dispose(): void {
    this.xys.disposeIfAuto();
    this.angles.disposeIfAuto();
    this.radii.disposeIfAuto();
    this.colors.disposeIfAuto();
  }
}
