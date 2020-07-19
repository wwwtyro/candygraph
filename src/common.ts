import { DrawCommand } from "regl";

export type UnpackPromise<T> = T extends Promise<infer U> ? U : never;

export type Viewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum RenderableType {
  Primitive,
  Composite,
}

export abstract class Primitive {
  public retained = false;
  public readonly kind = RenderableType.Primitive;

  public abstract command(glsl: string): DrawCommand;
  public abstract render(command: DrawCommand): void;
  public abstract dispose(): void;

  public retain() {
    this.retained = true;
    return this;
  }
}

export abstract class Composite {
  public readonly kind = RenderableType.Composite;
  public abstract children(): Renderable;

  public retain() {
    function recurse(renderable: Renderable) {
      if (Array.isArray(renderable)) {
        for (const element of renderable) {
          recurse(element);
        }
      } else if (renderable.kind === RenderableType.Composite) {
        recurse(renderable.children());
      } else if (renderable.kind === RenderableType.Primitive) {
        renderable.retained = true;
      }
    }
    recurse(this.children());
    return this;
  }

  public dispose(): void {
    function recurse(renderable: Renderable) {
      if (Array.isArray(renderable)) {
        for (const element of renderable) {
          recurse(element);
        }
      } else if (renderable.kind === RenderableType.Composite) {
        recurse(renderable.children());
      } else if (renderable.kind === RenderableType.Primitive) {
        renderable.retained = false;
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
export type Vector2 = NumberArray;
export type Vector3 = NumberArray;
export type Vector4 = NumberArray;
