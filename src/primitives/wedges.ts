import { Buffer } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, NumberArray, NamedDrawCommands } from "../common";
import { Dataset, createDataset } from "../dataset";

export interface WedgesOptions {
  /** The interior color of the wedges. If this value is a single Vector4, it will apply to all the wedges. Default [0, 0, 0, 0.5]. */
  colors?: NumberArray | Dataset;
  /** The radius of the wedges in pixels. If this value is a single number, it will apply to all the wedges. Default 10. */
  radii?: number | NumberArray | Dataset;
}

const DEFAULT_OPTIONS = {
  colors: [0, 0, 0, 0.5],
  radii: 10,
};

type Props = {
  position: Buffer;
  offset: Buffer;
  angle: Buffer;
  radius: Buffer;
  color: Buffer;
  colorDivisor: number;
  radiusDivisor: number;
  angleDivisor: number;
  instances: number;
};

/**
 * Useful for pie charts.
 */
export class Wedges extends Primitive {
  public readonly xys: Dataset;
  public readonly angles: Dataset;
  public readonly colors: Dataset;
  public readonly radii: Dataset;
  private positionBuffer: Buffer;

  /**
   * @param xys The x, y coordinates of the wedge point in the form `[x0, y0, x1, y1, ...]`.
   * @param angles The angle and arclength of each wedge in the form `[angle0, arclength0, angle1, arclength1, ...]`.
   */
  constructor(
    private cg: CandyGraph,
    xys: NumberArray | Dataset,
    angles: NumberArray | Dataset,
    options: WedgesOptions = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.xys = createDataset(cg, xys);
    this.angles = createDataset(cg, angles);
    this.colors = createDataset(cg, opts.colors);
    this.radii = createDataset(cg, opts.radii);
    this.positionBuffer = cg.regl.buffer([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);
  }

  /** @internal */
  public commands(glsl: string): NamedDrawCommands {
    return {
      wedges: this.cg.regl({
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
            buffer: this.cg.regl.prop<Props, "position">("position"),
            divisor: 0,
          },
          offset: {
            buffer: this.cg.regl.prop<Props, "offset">("offset"),
            divisor: 1,
          },
          angle: {
            buffer: this.cg.regl.prop<Props, "angle">("angle"),
            divisor: this.cg.regl.prop<Props, "angleDivisor">("angleDivisor"),
          },
          color: {
            buffer: this.cg.regl.prop<Props, "color">("color"),
            divisor: this.cg.regl.prop<Props, "colorDivisor">("colorDivisor"),
          },
          radius: {
            buffer: this.cg.regl.prop<Props, "radius">("radius"),
            divisor: this.cg.regl.prop<Props, "radiusDivisor">("radiusDivisor"),
          },
        },
        count: 6,
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
    };
  }

  /** @internal */
  public render(commands: NamedDrawCommands): void {
    const { xys, angles, colors, radii } = this;
    const instances = xys.count(2);
    commands.wedges({
      instances,
      position: this.positionBuffer,
      offset: xys.buffer,
      angle: angles.buffer,
      color: colors.buffer,
      radius: radii.buffer,
      angleDivisor: angles.divisor(instances, 2),
      colorDivisor: colors.divisor(instances, 4),
      radiusDivisor: radii.divisor(instances, 1),
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.xys.dispose();
    this.angles.dispose();
    this.radii.dispose();
    this.colors.dispose();
    this.positionBuffer.destroy();
  }
}
