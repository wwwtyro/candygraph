import { CandyGraph } from "../candygraph";
import { Composite, Renderable, Vector4, Vector2, NumberArray } from "../common";
import { VLines } from "../primitives/vlines";
import { HLines } from "../primitives/hlines";

export interface GridOptions {
  /** The width of the grid lines in pixels. Default 1. */
  width?: number;

  /** The color of the grid lines. Default [0.75, 0.75, 0.75, 1.0] */
  color?: Vector4;
}

const DEFAULTS = {
  width: 1.0,
  color: [0.75, 0.75, 0.75, 1.0],
};

/**
 * Renders a grid of HLines and VLines.
 */
export class Grid extends Composite {
  private grid: Renderable = [];

  /**
   *
   * @param xPositions The x-coordinates of all the vertical lines of the grid in the format `[x0, x1, ...]`.
   * @param yPositions The y-coordinates of all the horizontal lines of the grid in the format `[y0, y1, ...]`.
   * @param xExtents The start and end points of all the horizontal lines of the grid.
   * @param yExtents The start and end points of all the vertical lines of the grid.
   */
  constructor(
    cg: CandyGraph,
    xPositions: NumberArray,
    yPositions: NumberArray,
    xExtents: Vector2,
    yExtents: Vector2,
    options: GridOptions = {}
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

  /** @internal */
  public children(): Renderable {
    return this.grid;
  }
}
