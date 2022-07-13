import { Buffer, DrawCommand } from "regl";
import { CandyGraph } from "../candygraph";
import { Primitive, Vector4, NumberArray } from "../common";
import { Dataset, createDataset } from "./dataset";

export interface TrianglesOptions {
  /** The color of the triangles. Default [0, 0, 0, 0.5]. */
  color?: Vector4;
}

const DEFAULT_OPTIONS = {
  color: [0, 0, 0, 0.5],
};

type Props = {
  position: Buffer;
  color: Vector4;
  count: number;
};

export class Triangles extends Primitive {
  private vertices: Dataset;
  public color: Vector4;

  /**
   * @param vertices Set of 2D points in the form `[x0, y0, x1, y1, ...]` that
   * describe the (unindexed) set of triangles to render.
   */
  constructor(private cg: CandyGraph, vertices: NumberArray | Dataset, options: TrianglesOptions = {}) {
    super();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.vertices = createDataset(cg, vertices);
    this.color = opts.color.slice();
  }

  /** @internal */
  public command(glsl: string): DrawCommand {
    return this.cg.regl({
      vert: `
          precision highp float;
          attribute vec2 position;

          ${glsl}

          void main() {
            gl_Position = domainToClip(position);
          }`,

      frag: `
          precision highp float;
          uniform vec4 color;
          void main() {
            gl_FragColor = color;
          }`,

      attributes: {
        position: this.cg.regl.prop<Props, "position">("position"),
      },

      uniforms: {
        color: this.cg.regl.prop<Props, "color">("color"),
      },

      count: this.cg.regl.prop<Props, "count">("count"),
    });
  }

  /** @internal */
  public render(command: DrawCommand): void {
    const { vertices, color } = this;
    command({
      position: vertices.buffer,
      count: vertices.count(2),
      color,
    });
  }

  /** Releases all GPU resources and renders this instance unusable. */
  public dispose(): void {
    this.vertices.dispose();
  }
}
