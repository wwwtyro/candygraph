import { Buffer } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, NumberArray, NamedDrawCommands } from "../common";
import { Dataset, createDataset } from "../dataset";

export interface LineStripOptions {
  /** The width of the line strip segments. If this parameter is a single
   * number, it will apply to all segments. Default 1. */
  widths?: number | NumberArray | Dataset;

  /** The color of the line strip segments. If this parameter is a single
   * Vector4, it will apply to all segments. Default [0, 0, 0, 1]. */
  colors?: NumberArray | Dataset;
}

const DEFAULT_OPTIONS = {
  widths: 1,
  colors: [0, 0, 0, 1],
};

interface Props {
  position: Buffer;
  xs: Buffer;
  ys: Buffer;
  instances: number;
  width: Buffer;
  color: Buffer;
  widthDivisor: number;
  colorDivisor: number;
}

function roundCapJoinGeometry(resolution: number) {
  const instanceRoundRound = [
    [0, -0.5, 0],
    [0, -0.5, 1],
    [0, 0.5, 1],
    [0, -0.5, 0],
    [0, 0.5, 1],
    [0, 0.5, 0],
  ];
  // Add the left cap.
  for (let step = 0; step < resolution; step++) {
    const theta0 = Math.PI / 2 + ((step + 0) * Math.PI) / resolution;
    const theta1 = Math.PI / 2 + ((step + 1) * Math.PI) / resolution;
    instanceRoundRound.push([0, 0, 0]);
    instanceRoundRound.push([0.5 * Math.cos(theta0), 0.5 * Math.sin(theta0), 0]);
    instanceRoundRound.push([0.5 * Math.cos(theta1), 0.5 * Math.sin(theta1), 0]);
  }
  // Add the right cap.
  for (let step = 0; step < resolution; step++) {
    const theta0 = (3 * Math.PI) / 2 + ((step + 0) * Math.PI) / resolution;
    const theta1 = (3 * Math.PI) / 2 + ((step + 1) * Math.PI) / resolution;
    instanceRoundRound.push([0, 0, 1]);
    instanceRoundRound.push([0.5 * Math.cos(theta0), 0.5 * Math.sin(theta0), 1]);
    instanceRoundRound.push([0.5 * Math.cos(theta1), 0.5 * Math.sin(theta1), 1]);
  }

  return instanceRoundRound;
}

const ROUND_CAP_JOIN_GEOMETRY = roundCapJoinGeometry(16);

export class LineStrip extends Primitive {
  public readonly xs: Dataset;
  public readonly ys: Dataset;
  public readonly widths: Dataset;
  public readonly colors: Dataset;
  private roundCapJoin: Buffer;

  /**
   * @param xs An array of points in the format `[x0, x1, ...]` that represent
   * the x-coordinates of the line strip to be rendered.
   * @param ys An array of points in the format `[y0, y1, ...]` that represent
   * the y-coordinates of the line strip to be rendered.
   */
  constructor(
    private cg: CandyGraph,
    xs: NumberArray | Dataset,
    ys: NumberArray | Dataset,
    options: LineStripOptions = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.xs = createDataset(cg, xs);
    this.ys = createDataset(cg, ys);
    this.widths = createDataset(cg, opts.widths);
    this.colors = createDataset(cg, opts.colors);
    this.roundCapJoin = cg.regl.buffer(ROUND_CAP_JOIN_GEOMETRY);
  }

  /** @internal */
  public commands(glsl: string): NamedDrawCommands {
    return {
      strip: this.cg.regl({
        vert: `
      precision highp float;
      attribute vec3 position;
      attribute float ax, ay, bx, by;
      attribute float width;
      attribute vec4 color;

      varying vec4 vColor;

      ${glsl}

      void main() {
        vec2 offsetA = toRange(vec2(ax, ay));
        vec2 offsetB = toRange(vec2(bx, by));
        vec2 xBasis = normalize(offsetB - offsetA);
        vec2 yBasis = vec2(-xBasis.y, xBasis.x);
        vec2 pointA = offsetA + width * (position.x * xBasis + position.y * yBasis);
        vec2 pointB = offsetB + width * (position.x * xBasis + position.y * yBasis);
        vec2 point = mix(pointA, pointB, position.z);
        gl_Position = rangeToClip(point);
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
          ax: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 0,
          },
          ay: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 0,
          },
          bx: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 1,
          },
          by: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 1,
          },
          width: {
            buffer: this.cg.regl.prop<Props, "width">("width"),
            divisor: this.cg.regl.prop<Props, "widthDivisor">("widthDivisor"),
          },
          color: {
            buffer: this.cg.regl.prop<Props, "color">("color"),
            divisor: this.cg.regl.prop<Props, "colorDivisor">("colorDivisor"),
          },
        },

        count: ROUND_CAP_JOIN_GEOMETRY.length,
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
    };
  }

  /** @internal */
  public render(commands: NamedDrawCommands): void {
    const { xs, ys, widths, colors } = this;
    const instances = xs.count(1) - 1;
    commands.strip({
      instances,
      position: this.roundCapJoin,
      xs: xs.buffer,
      ys: ys.buffer,
      width: widths.buffer,
      color: colors.buffer,
      widthDivisor: widths.divisor(instances, 1),
      colorDivisor: colors.divisor(instances, 4),
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.xs.dispose();
    this.ys.dispose();
    this.widths.dispose();
    this.colors.dispose();
    this.roundCapJoin.destroy();
  }
}
