import { DrawCommand } from "regl";

export type NamedDrawCommands = Record<string, DrawCommand>;

export abstract class Primitive {
  /** @internal */
  public abstract commands(glsl: string): NamedDrawCommands;

  /** @internal */
  public abstract render(commands: NamedDrawCommands): void;

  /** Releases all GPU resources and renders this instance unusable. */
  public abstract dispose(): void;
}
