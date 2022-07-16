import { DrawCommand } from "regl";
import { CandyGraph } from "../candygraph";
import { Renderable } from "../common";
import { Composite } from "./composite";
import { CoordinateSystem } from "../coordinates/coordinate-system";

interface Props {
  box: { x: number; y: number; width: number; height: number };
}

/**
 * All child objects are clipped to the provided bounds.
 * @example
 * // Not in screen space, with an array of renderables.
 * new Scissor(cg, 0, 0, 1, 1, false, [
 *   new LineStrip(cg, xs, ys, {
 *     colors: [1, 0.5, 0, 1],
 *     widths: 3,
 *   }),
 *   new Circles(cg, xs, ys, {
 *     colors: [1, 0.5, 0, 1],
 *     radii: 6.0,
 *     borderWidths: 0,
 *   }),
 *   new Circles(cg, xs, ys, {
 *     colors: [0, 0, 0.25, 1],
 *     radii: 3.0,
 *     borderWidths: 0,
 *   }),
 * ]),
 *
 * @example
 * // In screen space, with a single renderable (not an array).
 * new Scissor(cg, 32, 32, viewport.width - 48, viewport.width - 48, true,
 *   new LineStrip(cg, xs, ys, {
 *       colors: [1, 0.5, 0, 1],
 *       widths: 3,
 *     }),
 * ),
 */

export class Scissor extends Composite {
  private _children: Renderable;
  public readonly scope: DrawCommand;

  /**
   * @param x The x-coordinate of the bottom-left corner of the scissor region.
   * @param y The y-coordinate of the bottom-left corner of the scissor region.
   * @param width The width of the scissor region.
   * @param height The height of the scissor region.
   * @param screenSpace Whether or not the scissor region is defined in screen space.
   * @param children One or more Renderables to be rendered with the scissor.
   */
  constructor(
    cg: CandyGraph,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public screenSpace: boolean,
    children: Renderable
  ) {
    super();

    this.scope = cg.regl({
      scissor: {
        enable: true,
        box: cg.regl.prop<Props, "box">("box"),
      },
    });

    this._children = children;
  }

  /** @internal */
  public props(coords: CoordinateSystem) {
    if (this.screenSpace) {
      return {
        box: { x: this.x, y: this.y, width: this.width, height: this.height },
      };
    }
    const xy0 = coords.toRange([this.x, this.y]);
    const xy1 = coords.toRange([this.x + this.width, this.y + this.height]);
    const wh = [xy1[0] - xy0[0], xy1[1] - xy0[1]];
    return { box: { x: xy0[0], y: xy0[1], width: wh[0], height: wh[1] } };
  }

  /** @internal */
  public children(): Renderable {
    return this._children;
  }
}
