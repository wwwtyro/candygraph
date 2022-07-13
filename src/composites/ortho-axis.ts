import { CandyGraph } from "../candygraph";
import { Composite, Renderable, NumberArray } from "../common";
import { CartesianCoordinateSystem } from "../coordinates/cartesian";
import { Kind as ScaleKind } from "../scales/scale";
import { Axis, AxisOptions } from "./axis";
import { Font } from "../primitives/font";

export interface OrthoAxisOptions extends AxisOptions {
  /** The maximum value encompassed by this axis. */
  axisHigh?: number;
  /** The position on the opposing axis that this axis intercepts. */
  axisIntercept?: number;
  /** The minimum value encompassed by this axis. */
  axisLow?: number;
  /** The function to use to format the ticks. Default `(n: number) => n.toString()`. */
  labelFormatter?: (n: number) => string;
  /** The number of minor ticks between major ticks. None if undefined. Default undefined. */
  minorTickCount?: number;
  /** Used to anchor ticks to the axis. Using a value of 0.1 and a tickStep of
   * 1.0 will result in ticks at `[... -1.9, -0.9, 0.1, 1.1 ... ]`. Default 0.*/
  tickOrigin?: number;
  /** The distance between ticks. Default 1. */
  tickStep?: number;
}

const DEFAULTS = {
  labelFormatter: (n: number) => n.toString(),
  tickOrigin: 0,
  tickStep: 1,
};

export interface OrthoAxisInfo {
  /** The position of the major ticks of this axis. */
  ticks: NumberArray;
  /** The position of the minor ticks of this axis. */
  minorTicks: NumberArray;
}

export class OrthoAxis extends Composite {
  public readonly info: OrthoAxisInfo;
  private axis: Renderable = [];

  constructor(
    cg: CandyGraph,
    coords: CartesianCoordinateSystem,
    axis: "x" | "y",
    font: Font,
    options: OrthoAxisOptions = {}
  ) {
    super();
    const opts = { ...DEFAULTS, ...options };
    const { axisIntercept, axisLow, axisHigh, minorTickCount, tickOrigin, tickStep, labelFormatter } = opts;

    if (tickStep === 0) {
      throw new Error("tickStep must be non-zero.");
    }

    const resolvedTickStep = Math.abs(tickStep);

    const isx = axis === "x";

    const scale = isx ? coords.xscale : coords.yscale;
    const otherScale = isx ? coords.yscale : coords.xscale;

    const resolvedAxisIntercept = axisIntercept ?? otherScale.domain[0];

    const resolvedAxisLow = axisLow ?? scale.domain[0];
    const resolvedAxisHigh = axisHigh ?? scale.domain[1];

    const ticks = [];

    if (scale.kind === ScaleKind.Linear) {
      let tickLocation =
        tickOrigin +
        resolvedTickStep * Math.floor((resolvedAxisLow - tickOrigin) / resolvedTickStep) -
        resolvedTickStep * 2;

      while (tickLocation <= resolvedAxisHigh + resolvedTickStep) {
        const tick = tickLocation - resolvedAxisLow;
        ticks.push(tick);
        tickLocation += resolvedTickStep;
      }
    } else if (scale.kind === ScaleKind.Log) {
      const tickPowerLow = Math.log(resolvedAxisLow) / Math.log(scale.base);
      const tickPowerHigh = Math.log(resolvedAxisHigh) / Math.log(scale.base);

      let tickPower =
        tickOrigin + resolvedTickStep * Math.floor((tickPowerLow - tickOrigin) / resolvedTickStep) - resolvedTickStep;

      while (tickPower <= tickPowerHigh + resolvedTickStep) {
        const tickLocation = Math.pow(scale.base, tickPower);
        const tick = tickLocation - resolvedAxisLow;
        ticks.push(tick);
        tickPower += resolvedTickStep;
      }
    }

    const minorTicks = [];
    if (minorTickCount !== undefined && minorTickCount > 0) {
      for (let i = 0; i < ticks.length - 1; i++) {
        const left = ticks[i];
        const right = ticks[i + 1];
        const step = (right - left) / (minorTickCount + 1);
        for (let j = 1; j <= minorTickCount; j++) {
          minorTicks.push(left + j * step);
        }
      }
    }

    const boundedTicks = ticks.filter((tick) => tick >= 0 && tick <= resolvedAxisHigh - resolvedAxisLow);
    const boundedMinorTicks = minorTicks.filter((tick) => tick >= 0 && tick <= resolvedAxisHigh - resolvedAxisLow);

    const labels = boundedTicks.map((tick) => labelFormatter(tick + resolvedAxisLow));

    this.axis = new Axis(
      cg,
      coords,
      isx ? [resolvedAxisLow, resolvedAxisIntercept] : [resolvedAxisIntercept, resolvedAxisLow],
      isx ? [resolvedAxisHigh, resolvedAxisIntercept] : [resolvedAxisIntercept, resolvedAxisHigh],
      boundedTicks,
      labels,
      font,
      { ...opts, minorTicks: boundedMinorTicks }
    );

    this.info = {
      ticks: boundedTicks.map((t) => t + resolvedAxisLow),
      minorTicks: boundedMinorTicks.map((t) => t + resolvedAxisLow),
    };
  }

  /** @internal */
  public children(): Renderable {
    return this.axis;
  }
}
