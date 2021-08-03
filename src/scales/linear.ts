import { Scale, Kind } from "./scale";
import { Vector2 } from "../common";

export function createLinearScale(domain: Vector2, range: Vector2): LinearScale {
  return new LinearScale(domain, range);
}

export class LinearScale extends Scale {
  public readonly kind = Kind.Linear;
  public readonly glsl = `
    float toDomain(float v, vec2 domain, vec2 range) {
      float qDomain = (domain.y - domain.x) / (range.y - range.x);
      return domain.x + qDomain * (v - range.x);
    }

    float toRange(float v, vec2 domain, vec2 range) {
      float qRange = (range.y - range.x) / (domain.y - domain.x);
      return range.x + qRange * (v - domain.x);
    }
  `;
  private _domain: Vector2 = [];
  private _range: Vector2 = [];
  private qDomain = 1;
  private qRange = 1;

  constructor(domain: Vector2, range: Vector2) {
    super();
    this.domain = domain;
    this.range = range;
  }

  public get domain(): Vector2 {
    return this._domain.slice();
  }

  public set domain(v: Vector2) {
    this._domain = v.slice();
    this.updateQ();
  }

  public get range(): Vector2 {
    return this._range.slice();
  }

  public set range(v: Vector2) {
    this._range = v.slice();
    this.updateQ();
  }

  public toDomain(v: number): number {
    return this._domain[0] + this.qDomain * (v - this._range[0]);
  }

  public toRange(v: number): number {
    return this._range[0] + this.qRange * (v - this._domain[0]);
  }

  private updateQ(): void {
    this.qDomain =
      (this._domain[1] - this._domain[0]) / (this._range[1] - this._range[0]);
    this.qRange = 1 / this.qDomain;
  }
}
