import { Regl, DrawCommand } from "regl";
import { Vector2 } from "../common";
import { CoordinateSystem, Kind } from "./coordinate-system";
import { LinearScale } from "../scales/linear";
import { LogScale } from "../scales/log";

type Props = {
  xdomain: Vector2;
  ydomain: Vector2;
  xrange: Vector2;
  yrange: Vector2;
};

export function createCartesianCoordinateSystem(
  xscale: LinearScale | LogScale,
  yscale: LinearScale | LogScale
) {
  return new CartesianCoordinateSystem(xscale, yscale);
}

export class CartesianCoordinateSystem extends CoordinateSystem {
  public readonly glsl: string;
  public readonly kind = Kind.Cartesian;

  constructor(
    public readonly xscale: LinearScale | LogScale,
    public readonly yscale: LinearScale | LogScale
  ) {
    super();

    const xglsl = xscale.glsl
      .replace("toDomain", "toXDomain")
      .replace("toRange", "toXRange");
    const yglsl = yscale.glsl
      .replace("toDomain", "toYDomain")
      .replace("toRange", "toYRange");
    this.glsl = `
    uniform vec2 xdomain, ydomain;
    uniform vec2 xrange, yrange;

    ${xglsl}
    ${yglsl}

    vec2 toRange(vec2 v) {
      return vec2(
        toXRange(v.x, xdomain, xrange),
        toYRange(v.y, ydomain, yrange)
      );
    }

    vec2 toDomain(vec2 v) {
      return vec2(
        toXDomain(v.x, xdomain, xrange),
        toYDomain(v.y, ydomain, yrange)
      );
    }
  `;
  }

  public toRange(v: Vector2): Vector2 {
    return [this.xscale.toRange(v[0]), this.yscale.toRange(v[1])];
  }

  public toDomain(v: Vector2): Vector2 {
    return [this.xscale.toDomain(v[0]), this.yscale.toDomain(v[1])];
  }

  public scope(regl: Regl): DrawCommand {
    return regl({
      uniforms: {
        xdomain: regl.prop<Props, "xdomain">("xdomain"),
        ydomain: regl.prop<Props, "ydomain">("ydomain"),
        xrange: regl.prop<Props, "xrange">("xrange"),
        yrange: regl.prop<Props, "yrange">("yrange"),
      },
    });
  }

  public props(): Props {
    return {
      xdomain: this.xscale.domain,
      ydomain: this.yscale.domain,
      xrange: this.xscale.range,
      yrange: this.yscale.range,
    };
  }
}
