import { DrawCommand } from "regl";
import { RenderableType } from "../common";

export type NamedDrawCommands = Record<string, DrawCommand>;

export abstract class Primitive {
  /** @internal */
  public readonly kind = RenderableType.Primitive;

  /** @internal */
  public abstract commands(glsl: string): NamedDrawCommands;

  /** @internal */
  public abstract render(commands: NamedDrawCommands): void;

  /** Releases all GPU resources and renders this instance unusable. */
  public abstract dispose(): void;
}
