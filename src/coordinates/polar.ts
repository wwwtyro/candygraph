import { DrawCommand } from "regl";
import { vec2 } from "gl-matrix";
import { Vector2 } from "../common";
import { CoordinateSystem, Kind } from "./coordinate-system";
import { LinearScale } from "../scales/linear";
import { LogScale } from "../scales/log";
import { CandyGraph } from "../candygraph";

type Props = {
  radialDomain: Vector2;
  radialRange: Vector2;
  angularDomain: Vector2;
  angularRange: Vector2;
  xDomain: Vector2;
  xRange: Vector2;
  yDomain: Vector2;
  yRange: Vector2;
};

export class PolarCoordinateSystem extends CoordinateSystem {
  /** @internal */
  public readonly glsl: string;

  /** @internal */
  public readonly kind = Kind.Polar;

  /** @internal */
  public readonly scope: DrawCommand;

  constructor(
    cg: CandyGraph,
    public readonly radialScale: LinearScale | LogScale,
    public readonly angularScale: LinearScale | LogScale,
    public readonly xScale: LinearScale | LogScale,
    public readonly yScale: LinearScale | LogScale
  ) {
    super();

    this.scope = cg.regl({
      uniforms: {
        xDomain: cg.regl.prop<Props, "xDomain">("xDomain"),
        xRange: cg.regl.prop<Props, "xRange">("xRange"),
        yDomain: cg.regl.prop<Props, "yDomain">("yDomain"),
        yRange: cg.regl.prop<Props, "yRange">("yRange"),
        radialDomain: cg.regl.prop<Props, "radialDomain">("radialDomain"),
        radialRange: cg.regl.prop<Props, "radialRange">("radialRange"),
        angularDomain: cg.regl.prop<Props, "angularDomain">("angularDomain"),
        angularRange: cg.regl.prop<Props, "angularRange">("angularRange"),
      },
    });

    const radialGLSL = radialScale.glsl.replace("toDomain", "toRadialDomain").replace("toRange", "toRadialRange");
    const angularGLSL = angularScale.glsl.replace("toDomain", "toAngularDomain").replace("toRange", "toAngularRange");
    const xGLSL = xScale.glsl.replace("toDomain", "toXDomain").replace("toRange", "toXRange");
    const yGLSL = yScale.glsl.replace("toDomain", "toYDomain").replace("toRange", "toYRange");
    this.glsl = `
      uniform vec2 radialDomain, radialRange;
      uniform vec2 angularDomain, angularRange;
      uniform vec2 xDomain, xRange;
      uniform vec2 yDomain, yRange;

      ${radialGLSL}
      ${angularGLSL}
      ${xGLSL}
      ${yGLSL}

      vec2 toRange(vec2 v) {
        vec2 polar = vec2(
          toRadialRange(v.x, radialDomain, radialRange),
          toAngularRange(v.y, angularDomain, angularRange)
        );
        vec2 cartesian = polar.x * vec2(
          cos(polar.y),
          sin(polar.y)
        );
        return vec2(
          toXRange(cartesian.x, xDomain, xRange),
          toYRange(cartesian.y, yDomain, yRange)
        );
      }

      vec2 toDomain(vec2 v) {
        vec2 cartesian = vec2(
          toXDomain(v.x, xDomain, xRange),
          toYDomain(v.y, yDomain, yRange)
        );
        vec2 polar = vec2(
          length(cartesian),
          atan(cartesian.y, cartesian.x)
        );
        return vec2(
          toRadialDomain(polar.x, radialDomain, radialRange),
          toAngularDomain(polar.y, angularDomain, angularRange)
        );
      }
    `;
  }

  public toRange(v: Vector2): Vector2 {
    const polar = [this.radialScale.toRange(v[0]), this.angularScale.toRange(v[1])];
    const cartesian = [polar[0] * Math.cos(polar[1]), polar[0] * Math.sin(polar[1])];
    return [this.xScale.toRange(cartesian[0]), this.yScale.toRange(cartesian[1])];
  }

  public toDomain(v: Vector2): Vector2 {
    const cartesian = [this.xScale.toDomain(v[0]), this.yScale.toDomain(v[1])];
    const polar = [vec2.length(cartesian as vec2), Math.atan2(cartesian[1], cartesian[0])];
    return [this.radialScale.toDomain(polar[0]), this.angularScale.toDomain(polar[1])];
  }

  /** @internal */
  public props(): Props {
    return {
      radialDomain: this.radialScale.domain,
      radialRange: this.radialScale.range,
      angularDomain: this.angularScale.domain,
      angularRange: this.angularScale.range,
      xDomain: this.xScale.domain,
      xRange: this.xScale.range,
      yDomain: this.yScale.domain,
      yRange: this.yScale.range,
    };
  }
}
