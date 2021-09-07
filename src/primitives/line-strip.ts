import { Regl, Buffer, DrawCommand } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

type Options = {
  widths?: number | NumberArray | Dataset;
  colors?: NumberArray | Dataset;
};

const DEFAULT_OPTIONS = {
  widths: 1,
  colors: [0, 0, 0, 1],
};

interface Props {
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
    instanceRoundRound.push([
      0.5 * Math.cos(theta0),
      0.5 * Math.sin(theta0),
      0,
    ]);
    instanceRoundRound.push([
      0.5 * Math.cos(theta1),
      0.5 * Math.sin(theta1),
      0,
    ]);
  }
  // Add the right cap.
  for (let step = 0; step < resolution; step++) {
    const theta0 = (3 * Math.PI) / 2 + ((step + 0) * Math.PI) / resolution;
    const theta1 = (3 * Math.PI) / 2 + ((step + 1) * Math.PI) / resolution;
    instanceRoundRound.push([0, 0, 1]);
    instanceRoundRound.push([
      0.5 * Math.cos(theta0),
      0.5 * Math.sin(theta0),
      1,
    ]);
    instanceRoundRound.push([
      0.5 * Math.cos(theta1),
      0.5 * Math.sin(theta1),
      1,
    ]);
  }

  return instanceRoundRound;
}

// Set when the position buffer is created.
let geometryCount: number;

function getPositionBuffer(cg: CandyGraph) {
  if (!cg.hasPositionBuffer('lineStrip')) {
    const geometry = roundCapJoinGeometry(16);
    geometryCount = geometry.length;
    cg.setPositionBuffer('lineStrip', geometry);
  }
  return cg.getPositionBuffer('lineStrip');
}

export function createLineStrip(
  cg: CandyGraph,
  xs: NumberArray | Dataset,
  ys: NumberArray | Dataset,
  options?: Options
) {
  const geometry = getPositionBuffer(cg)!;
  return new LineStrip(cg.regl, geometry, geometryCount, xs, ys, options);
}

export class LineStrip extends Primitive {
  public readonly xs: Dataset;
  public readonly ys: Dataset;
  public readonly widths: Dataset;
  public readonly colors: Dataset;

  constructor(
    private regl: Regl,
    private roundCapJoin: Buffer,
    private geometryCount: number,
    xs: NumberArray | Dataset,
    ys: NumberArray | Dataset,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.xs = createDataset(regl, xs);
    this.ys = createDataset(regl, ys);
    this.widths = createDataset(regl, opts.widths);
    this.colors = createDataset(regl, opts.colors);
  }

  public command(glsl: string): DrawCommand {
    return this.regl({
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
          buffer: this.roundCapJoin,
          divisor: 0,
        },
        ax: {
          buffer: this.regl.prop<Props, "xs">("xs"),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
        },
        ay: {
          buffer: this.regl.prop<Props, "ys">("ys"),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
        },
        bx: {
          buffer: this.regl.prop<Props, "xs">("xs"),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 1,
        },
        by: {
          buffer: this.regl.prop<Props, "ys">("ys"),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 1,
        },
        width: {
          buffer: this.regl.prop<Props, "width">("width"),
          divisor: this.regl.prop<Props, "widthDivisor">("widthDivisor"),
        },
        color: {
          buffer: this.regl.prop<Props, "color">("color"),
          divisor: this.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
      },

      count: this.geometryCount,
      instances: this.regl.prop<Props, "instances">("instances"),
    });
  }

  public render(command: DrawCommand): void {
    const { xs, ys, widths, colors } = this;
    const instances = xs.count(1) - 1;
    command({
      instances,
      xs: xs.buffer,
      ys: ys.buffer,
      width: widths.buffer,
      color: colors.buffer,
      widthDivisor: widths.divisor(instances, 1),
      colorDivisor: colors.divisor(instances, 4),
    });
  }

  public dispose(): void {
    this.xs.disposeIfAuto();
    this.ys.disposeIfAuto();
    this.widths.disposeIfAuto();
    this.colors.disposeIfAuto();
  }
}
