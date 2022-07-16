import { Primitive } from "./primitives/primitive";
import { Composite } from "./composites/composite";

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Renderable = Primitive | Composite | Renderable[];

export type NumberArray = number[] | Float32Array;

// I couldn't seem to get Typescript tuples [number, number, ...] to
// work in any reasonable way, so I'm just going to use type aliases to
// provide a hint. ¯\_(ツ)_/¯
export type Vector2 = number[] | Float32Array;
export type Vector3 = number[] | Float32Array;
export type Vector4 = number[] | Float32Array;
