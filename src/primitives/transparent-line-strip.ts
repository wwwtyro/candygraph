import { Buffer, Elements } from "regl";
import { CandyGraph } from "../candygraph";
import { NumberArray, Vector4 } from "../common";
import { Primitive, NamedDrawCommands } from "./primitive";
import { Dataset, createDataset } from "../dataset";

export interface TransparentLineStripOptions {
  /** The width of the line strip. Default 1. */
  width?: number;

  /** The color of the line strip. Default [0, 0, 0, 1]. */
  color?: Vector4;
}

const DEFAULT_OPTIONS = {
  width: 1,
  color: [0, 0, 0, 1],
};

interface Props {
  cells: Elements;
  position: Buffer;
  id: number;
  xs: Buffer;
  ys: Buffer;
  instances: number;
  width: Buffer;
  color: Buffer;
  offsetA: number;
  offsetB: number;
  offsetC: number;
}

const SEGMENT_GEOMETRY = {
  positions: [
    [0, -0.5],
    [1, -0.5],
    [1, 0.5],
    [0, 0.5],
  ],
  cells: [
    [0, 1, 2],
    [0, 2, 3],
  ],
};

const JOIN_GEOMETRY = (function roundGeometry(resolution: number) {
  const ids: number[] = [];
  const cells: number[][] = [];
  for (let i = 0; i < resolution + 2; i++) {
    ids.push(i);
  }
  for (let i = 0; i < resolution; i++) {
    cells.push([0, i + 1, i + 2]);
  }
  return { ids, cells, resolution };
})(16);

const CAP_GEOMETRY = (function roundCapGeometry(resolution: number) {
  const positions = [[0, 0]];
  for (let i = 0; i <= resolution; i++) {
    const theta = -0.5 * Math.PI + (Math.PI * i) / resolution;
    positions.push([0.5 * Math.cos(theta), 0.5 * Math.sin(theta)]);
  }
  const cells: number[][] = [];
  for (let i = 0; i < resolution; i++) {
    cells.push([0, i + 1, i + 2]);
  }
  return { positions, cells };
})(16);

/**
 * Similar to LineStrip, but without the alpha overlap artifacts. Uses six times
 * as many draw calls as LineStrip, so can be slower if you're CPU bound. Unlike
 * LineStrip, per-vertex color and width is not supported; the color and width
 * is constant for each TransparentLineStrip.
 */
export class TransparentLineStrip extends Primitive {
  public readonly xs: Dataset;
  public readonly ys: Dataset;
  public width: number;
  public color: Vector4;
  private segmentPositions: Buffer;
  private segmentCells: Elements;
  private joinIds: Buffer;
  private joinCells: Elements;
  private capPositions: Buffer;
  private capCells: Elements;

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
    options: TransparentLineStripOptions = {}
  ) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.xs = createDataset(cg, xs);
    this.ys = createDataset(cg, ys);
    this.width = opts.width;
    this.color = opts.color;
    this.segmentPositions = cg.regl.buffer(SEGMENT_GEOMETRY.positions);
    this.segmentCells = cg.regl.elements(SEGMENT_GEOMETRY.cells);
    this.joinIds = cg.regl.buffer(JOIN_GEOMETRY.ids);
    this.joinCells = cg.regl.elements(JOIN_GEOMETRY.cells);
    this.capPositions = cg.regl.buffer(CAP_GEOMETRY.positions);
    this.capCells = cg.regl.elements(CAP_GEOMETRY.cells);
  }

  /** @internal */
  public commands(glsl: string): NamedDrawCommands {
    return {
      intermediateSegments: this.cg.regl({
        vert: `
            precision highp float;
            attribute vec2 position;
            attribute float ax, ay, bx, by, cx, cy, dx, dy;
            uniform float width;

            ${glsl}

            void main() {
              vec2 p0 = toRange(vec2(ax, ay));
              vec2 p1 = toRange(vec2(bx, by));
              vec2 p2 = toRange(vec2(cx, cy));
              vec2 pos = position;
              if (position.x == 1.0) {
                p0 = toRange(vec2(dx, dy));
                p1 = toRange(vec2(cx, cy));
                p2 = toRange(vec2(bx, by));
                pos = vec2(1.0 - position.x, -position.y);
              }
              vec2 tangent = normalize(normalize(p2 - p1) + normalize(p1 - p0));
              vec2 normal = vec2(-tangent.y, tangent.x);
              vec2 p01 = p1 - p0;
              vec2 p21 = p1 - p2;
              vec2 p01Norm = normalize(vec2(-p01.y, p01.x));
              float sigma = sign(dot(p01 + p21, normal));
              if (sign(pos.y) == -sigma) {
                vec2 point = p1 + 0.5 * width * normal * -sigma / dot(normal, p01Norm);
                // Make sure that the position of the join is within the bounds
                // of all three points
                gl_Position = rangeToClip(
                  clamp(point, min(p0, min(p1, p2)), max(p0, max(p1, p2)))
                );
              } else {
                vec2 xBasis = p2 - p1;
                vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
                vec2 point = p1 + xBasis * pos.x + yBasis * width * pos.y;
                gl_Position = rangeToClip(point);
              }
            }`,

        frag: `
            precision highp float;
            uniform vec4 color;
            void main() {
              gl_FragColor = color;
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
          cx: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 2,
          },
          cy: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 2,
          },
          dx: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 3,
          },
          dy: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 3,
          },
        },
        uniforms: {
          color: this.cg.regl.prop<Props, "color">("color"),
          width: this.cg.regl.prop<Props, "width">("width"),
        },
        elements: this.cg.regl.prop<Props, "cells">("cells"),
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
      terminalSegment: this.cg.regl({
        vert: `
          precision highp float;
          attribute vec2 position;
          attribute float ax, ay, bx, by, cx, cy;
          uniform float width;
          ${glsl}
          void main() {
            vec2 pA = toRange(vec2(ax, ay));
            vec2 pB = toRange(vec2(bx, by));
            vec2 pC = toRange(vec2(cx, cy));

            vec2 ab = pB - pA;
            vec2 abNorm = normalize(vec2(-ab.y, ab.x));

            if (position.x == 0.0) {
              vec2 point = pA + ab * position.x + abNorm * width * position.y;
              gl_Position = rangeToClip(point);
              return;
            }

            vec2 tangent = normalize(normalize(pC - pB) + normalize(ab));
            vec2 normal = vec2(-tangent.y, tangent.x);
            vec2 cb = pB - pC;
            float sigma = sign(dot(ab + cb, normal));

            if (sign(position.y) == -sigma) {
              vec2 position = pB + 0.5 * width * normal * -sigma / dot(normal, abNorm);
              // Make sure that the position of the join is within the bounds
              // of all three points
              gl_Position = rangeToClip(
                clamp(position, min(pA, min(pB, pC)), max(pA, max(pB, pC)))
              );
            } else {
              vec2 point = pA + ab * position.x + abNorm * width * position.y;
              gl_Position = rangeToClip(point);
            }
          }`,
        frag: `
          precision highp float;
          uniform vec4 color;
          void main() {
            gl_FragColor = color;
          }`,
        attributes: {
          position: {
            buffer: this.cg.regl.prop<Props, "position">("position"),
            divisor: 0,
          },
          ax: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetA">("offsetA"),
          },
          ay: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetA">("offsetA"),
          },
          bx: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetB">("offsetB"),
          },
          by: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetB">("offsetB"),
          },
          cx: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetC">("offsetC"),
          },
          cy: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetC">("offsetC"),
          },
        },
        uniforms: {
          color: this.cg.regl.prop<Props, "color">("color"),
          width: this.cg.regl.prop<Props, "width">("width"),
        },
        elements: this.cg.regl.prop<Props, "cells">("cells"),
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
      joins: this.cg.regl({
        vert: `
          precision highp float;
          attribute float ax, ay, bx, by, cx, cy;
          attribute float id;
          uniform float width;
          const float slices = ${JOIN_GEOMETRY.resolution.toExponential()};
          ${glsl}
          void main() {
            vec2 pA = toRange(vec2(ax, ay));
            vec2 pB = toRange(vec2(bx, by));
            vec2 pC = toRange(vec2(cx, cy));
            vec2 ab = pB - pA;
            vec2 xBasis = normalize(normalize(pC - pB) + normalize(ab));
            vec2 yBasis = vec2(-xBasis.y, xBasis.x);
            vec2 cb = pB - pC;
            vec2 abn = normalize(vec2(-ab.y, ab.x));
            vec2 cbn = -normalize(vec2(-cb.y, cb.x));
            float sigma = sign(dot(ab + cb, yBasis));
            if (id == 0.0) {
              vec2 position = pB + -0.5 * yBasis * sigma * width / dot(yBasis, abn);
              // Make sure that the position of the join is within the bounds
              // of all three points
              gl_Position = rangeToClip(
                clamp(position, min(pA, min(pB, pC)), max(pA, max(pB, pC)))
              );
              return;
            }
            float theta = acos(dot(abn, cbn));
            theta = (sigma * 0.5 * ${Math.PI}) + -0.5 * theta + theta * (id - 1.0) / slices;
            vec2 pos = 0.5 * width * vec2(cos(theta), sin(theta));
            pos = pB + xBasis * pos.x + yBasis * pos.y;
            gl_Position = rangeToClip(pos);
          }`,
        frag: `
          precision highp float;
          uniform vec4 color;
          void main() {
            gl_FragColor = color;
          }`,
        attributes: {
          id: {
            buffer: this.cg.regl.prop<Props, "id">("id"),
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
          cx: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 2,
          },
          cy: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 2,
          },
        },
        uniforms: {
          color: this.cg.regl.prop<Props, "color">("color"),
          width: this.cg.regl.prop<Props, "width">("width"),
        },
        elements: this.cg.regl.prop<Props, "cells">("cells"),
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
      cap: this.cg.regl({
        vert: `
          precision highp float;
          attribute vec2 position;
          attribute float ax, ay, bx, by;
          uniform float width;
          ${glsl}
          void main() {
            vec2 pA = toRange(vec2(ax, ay));
            vec2 pB = toRange(vec2(bx, by));
            vec2 xBasis = normalize(pA - pB);
            vec2 yBasis = vec2(-xBasis.y, xBasis.x);
            vec2 point = pA + xBasis * width * position.x + yBasis * width * position.y;
            gl_Position = rangeToClip(point);
          }`,
        frag: `
          precision highp float;
          uniform vec4 color;
          void main() {
            gl_FragColor = color;
          }`,
        attributes: {
          position: {
            buffer: this.cg.regl.prop<Props, "position">("position"),
            divisor: 0,
          },
          ax: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetA">("offsetA"),
          },
          ay: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetA">("offsetA"),
          },
          bx: {
            buffer: this.cg.regl.prop<Props, "xs">("xs"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetB">("offsetB"),
          },
          by: {
            buffer: this.cg.regl.prop<Props, "ys">("ys"),
            divisor: 1,
            offset: this.cg.regl.prop<Props, "offsetB">("offsetB"),
          },
        },
        uniforms: {
          color: this.cg.regl.prop<Props, "color">("color"),
          width: this.cg.regl.prop<Props, "width">("width"),
        },
        elements: this.cg.regl.prop<Props, "cells">("cells"),
        instances: this.cg.regl.prop<Props, "instances">("instances"),
      }),
    };
  }

  /** @internal */
  public render(commands: NamedDrawCommands): void {
    const { xs, ys, width, color } = this;
    const instances = xs.count(1) - 3;
    if (instances < 0) {
      throw new Error(
        "A TransparentLineStrip must have at least two segments (three points). Consider using a LineSegment instead."
      );
    }
    commands.intermediateSegments({
      instances,
      position: this.segmentPositions,
      cells: this.segmentCells,
      xs: xs.buffer,
      ys: ys.buffer,
      width,
      color,
    });
    commands.terminalSegment({
      instances: 1,
      offsetA: Float32Array.BYTES_PER_ELEMENT * 0,
      offsetB: Float32Array.BYTES_PER_ELEMENT * 1,
      offsetC: Float32Array.BYTES_PER_ELEMENT * 2,
      position: this.segmentPositions,
      cells: this.segmentCells,
      xs: xs.buffer,
      ys: ys.buffer,
      width,
      color,
    });
    commands.terminalSegment({
      instances: 1,
      offsetA: Float32Array.BYTES_PER_ELEMENT * (2 + instances),
      offsetB: Float32Array.BYTES_PER_ELEMENT * (1 + instances),
      offsetC: Float32Array.BYTES_PER_ELEMENT * (0 + instances),
      position: this.segmentPositions,
      cells: this.segmentCells,
      xs: xs.buffer,
      ys: ys.buffer,
      width,
      color,
    });
    commands.joins({
      instances: instances + 1,
      id: this.joinIds,
      cells: this.joinCells,
      xs: xs.buffer,
      ys: ys.buffer,
      width,
      color,
    });
    commands.cap({
      instances: 1,
      offsetA: Float32Array.BYTES_PER_ELEMENT * 0,
      offsetB: Float32Array.BYTES_PER_ELEMENT * 1,
      position: this.capPositions,
      cells: this.capCells,
      xs: xs.buffer,
      ys: ys.buffer,
      width,
      color,
    });
    commands.cap({
      instances: 1,
      offsetA: Float32Array.BYTES_PER_ELEMENT * (2 + instances),
      offsetB: Float32Array.BYTES_PER_ELEMENT * (1 + instances),
      position: this.capPositions,
      cells: this.capCells,
      xs: xs.buffer,
      ys: ys.buffer,
      width,
      color,
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.xs.dispose();
    this.ys.dispose();
    this.segmentPositions.destroy();
    this.segmentCells.destroy();
    this.joinIds.destroy();
    this.joinCells.destroy();
    this.capPositions.destroy();
    this.capCells.destroy();
  }
}
