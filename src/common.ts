import { DrawCommand } from "regl";
import { CoordinateSystem } from "./coordinates/coordinate-system";

export type UnpackPromise<T> = T extends Promise<infer U> ? U : never;

export type NamedDrawCommands = Record<string, DrawCommand>;

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum RenderableType {
  Primitive,
  Composite,
}

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

export abstract class Composite {
  /** @internal */
  public readonly kind = RenderableType.Composite;

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
      } else if (renderable.kind === RenderableType.Composite) {
        recurse(renderable.children());
      } else if (renderable.kind === RenderableType.Primitive) {
        renderable.dispose();
      }
    }
    recurse(this.children());
  }
}

export type Renderable = Primitive | Composite | Renderable[];

export type NumberArray = number[] | Float32Array;

// I couldn't seem to get Typescript tuples [number, number, ...] to
// work in any reasonable way, so I'm just going to use type aliases to
// provide a hint. ¯\_(ツ)_/¯
export type Vector2 = number[] | Float32Array;
export type Vector3 = number[] | Float32Array;
export type Vector4 = number[] | Float32Array;
