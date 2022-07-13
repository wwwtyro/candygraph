import { CandyGraph } from "../candygraph";
import { Composite, Renderable, Vector4, Vector2, NumberArray } from "../common";
import { VLines } from "../primitives/vlines";
import { HLines } from "../primitives/hlines";

type Options = {
  width?: number;
  color?: Vector4;
};

const DEFAULTS = {
  width: 1.0,
  color: [0.75, 0.75, 0.75, 1.0],
};

export class Grid extends Composite {
  private grid: Renderable = [];

  constructor(
    cg: CandyGraph,
    xPositions: NumberArray,
    yPositions: NumberArray,
    xExtents: Vector2,
    yExtents: Vector2,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULTS, ...options };
    const { width, color } = opts;

    this.grid = [];
    if (xPositions.length > 0) {
      const lines = [];
      for (const xp of xPositions) {
        lines.push(xp, yExtents[0], yExtents[1]);
      }
      this.grid.push(new VLines(cg, lines, { widths: width, colors: color }));
    }
    if (yPositions.length > 0) {
      const lines = [];
      for (const yp of yPositions) {
        lines.push(xExtents[0], xExtents[1], yp);
      }
      this.grid.push(new HLines(cg, lines, { widths: width, colors: color }));
    }
  }

  public children(): Renderable {
    return this.grid;
  }
}
