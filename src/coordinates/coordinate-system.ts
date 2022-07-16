import { DrawCommand } from "regl";
import { Vector2 } from "../common";

export enum Kind {
  Cartesian,
  Polar,
}

export abstract class CoordinateSystem {
  /** @internal */
  public abstract readonly kind: Kind;

  /** @internal */
  public abstract readonly glsl: string;

  /** @internal */
  public abstract readonly scope: DrawCommand;

  /** @internal */
  public abstract props(): Record<string, any>;

  public abstract toDomain(rangeVector: Vector2): Vector2;
  public abstract toRange(domainVector: Vector2): Vector2;
}
