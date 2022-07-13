import { Scale, Kind } from "./scale";
import { Vector2 } from "../common";

export class LogScale extends Scale {
  public readonly kind = Kind.Log;
  public readonly glsl: string;
  private _domain: Vector2 = [];
  private _range: Vector2 = [];
  private conversion: number;

  constructor(public readonly base: number, domain: Vector2, range: Vector2) {
    super();
    this.conversion = 1 / Math.log(base);
    this.glsl = `
      float toDomain(float v, vec2 domain, vec2 range) {
        const float conversion = ${this.conversion.toExponential()};
        const float base = ${this.base.toExponential()};
        vec2 logDomain = conversion * vec2(log(domain.x), log(domain.y));
        float qDomain = (logDomain.y - logDomain.x) / (range.y - range.x);
        float logValue = logDomain.x + qDomain * (v - range.x);
        return pow(base, logValue);
      }

      float toRange(float v, vec2 domain, vec2 range) {
        const float conversion = ${this.conversion.toExponential()};
        float logv = log(v) * conversion;
        vec2 logDomain = conversion * vec2(log(domain.x), log(domain.y));
        float qRange = (range.y - range.x) / (logDomain.y - logDomain.x);
        return range.x + qRange * (logv - logDomain.x);
      }
    `;
    this.domain = domain;
    this.range = range;
  }

  get domain(): Vector2 {
    return this._domain.slice();
  }

  set domain(v: Vector2) {
    this._domain = v.slice();
  }

  get range(): Vector2 {
    return this._range.slice();
  }

  set range(v: Vector2) {
    this._range = v.slice();
  }

  public toRange(value: number): number {
    const logValue = Math.log(value) * this.conversion;
    const logDomain = [Math.log(this._domain[0]) * this.conversion, Math.log(this._domain[1]) * this.conversion];
    const qRange = (this._range[1] - this._range[0]) / (logDomain[1] - logDomain[0]);
    return this._range[0] + qRange * (logValue - logDomain[0]);
  }

  public toDomain(value: number): number {
    const logDomain = [Math.log(this._domain[0]) * this.conversion, Math.log(this._domain[1]) * this.conversion];
    const qDomain = (logDomain[1] - logDomain[0]) / (this._range[1] - this._range[0]);
    const logValue = logDomain[0] + qDomain * (value - this._range[0]);
    return Math.pow(this.base, logValue);
  }
}
