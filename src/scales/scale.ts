import { Vector2 } from "../common";

export enum Kind {
  Linear,
  Log,
}

export abstract class Scale {
  /** @internal */
  public abstract readonly kind: Kind;

  /** @internal */
  public abstract readonly glsl: string;

  public abstract get domain(): Vector2;
  public abstract set domain(v: Vector2);
  public abstract get range(): Vector2;
  public abstract set range(v: Vector2);
  public abstract toDomain(rangeValue: number): number;
  public abstract toRange(domainValue: number): number;
}
