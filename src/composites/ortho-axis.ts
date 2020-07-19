import { Composite, Renderable, NumberArray } from "../common";
import { CartesianCoordinateSystem } from "../coordinates/cartesian";
import { Kind as ScaleKind } from "../scales/scale";
import { axis as Axis } from ".";
import { Font } from "../primitives/font";

type Options = {
  axisHigh?: number;
  axisIntercept?: number;
  axisLow?: number;
  labelFormatter?: (n: number) => string;
  minorTickCount?: number;
  tickOrigin?: number;
  tickStep?: number;
} & Axis.Options;

const DEFAULTS = {
  labelFormatter: (n: number) => n.toString(),
  tickOrigin: 0,
  tickStep: 1,
};

type Info = {
  ticks: NumberArray;
  minorTicks: NumberArray;
};

export type Factory = ReturnType<typeof factory>;

export function factory(axisFactory: Axis.Factory) {
  return function (
    coords: CartesianCoordinateSystem,
    axis: "x" | "y",
    font: Font,
    options?: Options
  ): OrthoAxis {
    return new OrthoAxis(axisFactory, coords, axis, font, options);
  };
}

export class OrthoAxis extends Composite {
  public readonly info: Info;
  private axis: Renderable = [];

  constructor(
    axisFactory: Axis.Factory,
    coords: CartesianCoordinateSystem,
    axis: "x" | "y",
    font: Font,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULTS, ...options };
    const {
      axisIntercept,
      axisLow,
      axisHigh,
      minorTickCount,
      tickOrigin,
      tickStep,
      labelFormatter,
    } = opts;

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
        resolvedTickStep *
          Math.floor((resolvedAxisLow - tickOrigin) / resolvedTickStep) -
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
        tickOrigin +
        resolvedTickStep *
          Math.floor((tickPowerLow - tickOrigin) / resolvedTickStep) -
        resolvedTickStep;

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

    const boundedTicks = ticks.filter(
      (tick) => tick >= 0 && tick <= resolvedAxisHigh - resolvedAxisLow
    );
    const boundedMinorTicks = minorTicks.filter(
      (tick) => tick >= 0 && tick <= resolvedAxisHigh - resolvedAxisLow
    );

    const labels = boundedTicks.map((tick) =>
      labelFormatter(tick + resolvedAxisLow)
    );

    this.axis = axisFactory(
      coords,
      isx
        ? [resolvedAxisLow, resolvedAxisIntercept]
        : [resolvedAxisIntercept, resolvedAxisLow],
      isx
        ? [resolvedAxisHigh, resolvedAxisIntercept]
        : [resolvedAxisIntercept, resolvedAxisHigh],
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

  public children(): Renderable {
    return this.axis;
  }
}
