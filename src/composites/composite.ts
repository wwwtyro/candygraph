import { DrawCommand } from "regl";
import { Renderable } from "../common";
import { Primitive } from "../primitives/primitive";
import { CoordinateSystem } from "../coordinates/coordinate-system";

export abstract class Composite {
  /** @internal */
  public abstract children(): Renderable;

  /** @internal */
  public readonly scope: DrawCommand | null = null;

  /** @internal */
  public props(coords: CoordinateSystem) {
    return {};
  }

  /** Releases all GPU resources and renders this instance unusable. Also disposes any children. */
  public dispose(): void {
    function recurse(renderable: Renderable) {
      if (Array.isArray(renderable)) {
        for (const element of renderable) {
          recurse(element);
        }
      } else if (renderable instanceof Composite) {
        recurse(renderable.children());
      } else if (renderable instanceof Primitive) {
        renderable.dispose();
      }
    }
    recurse(this.children());
  }
}
