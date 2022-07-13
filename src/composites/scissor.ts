import { DrawCommand } from "regl";
import { CandyGraph } from "../candygraph";
import { Composite, Renderable } from "../common";
import { CoordinateSystem } from "../coordinates/coordinate-system";

type Props = {
  box: { x: number; y: number; width: number; height: number };
};

export class Scissor extends Composite {
  private _children: Renderable;
  public readonly scope: DrawCommand;

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

  public children(): Renderable {
    return this._children;
  }
}
