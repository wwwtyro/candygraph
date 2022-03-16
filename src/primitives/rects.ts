import { Regl, Buffer, DrawCommand } from "regl";
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
  rect: Buffer;
  color: Buffer;
  colorDivisor: number;
  instances: number;
};

function getPositionBuffer(cg: CandyGraph) {
  if (!cg.hasPositionBuffer("rects")) {
    cg.setPositionBuffer(
      "rects",
      // prettier-ignore
      [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]
    );
  }
  return cg.getPositionBuffer("rects");
}

export function createRects(cg: CandyGraph, rects: NumberArray | Dataset, options?: Options) {
  const positionBuffer = getPositionBuffer(cg)!;
  return new Rects(cg.regl, positionBuffer, rects, options);
}

export class Rects extends Primitive {
  public readonly rects: Dataset;
  public readonly colors: Dataset;

  constructor(private regl: Regl, private positionBuffer: Buffer, rects: NumberArray | Dataset, options: Options = {}) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.rects = createDataset(regl, rects);
    this.colors = createDataset(regl, opts.colors);
  }

  public command(glsl: string): DrawCommand {
    return this.regl({
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
          buffer: this.positionBuffer,
          divisor: 0,
        },
        rect: {
          buffer: this.regl.prop<Props, "rect">("rect"),
          divisor: 1,
        },
        color: {
          buffer: this.regl.prop<Props, "color">("color"),
          divisor: this.regl.prop<Props, "colorDivisor">("colorDivisor"),
        },
      },
      count: 6,
      instances: this.regl.prop<Props, "instances">("instances"),
    });
  }

  public render(command: DrawCommand): void {
    const { rects, colors } = this;
    const instances = rects.count(4);
    command({
      instances,
      rect: rects.buffer,
      color: colors.buffer,
      colorDivisor: colors.divisor(instances, 4),
    });
  }

  public dispose(): void {
    this.rects.dispose();
    this.colors.dispose();
  }
}
