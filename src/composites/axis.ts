import { vec2 } from "gl-matrix";
import { CoordinateSystem } from "../coordinates/coordinate-system";
import {
  Composite,
  Renderable,
  Vector4,
  Vector2,
  NumberArray,
} from "../common";
import * as primitives from "../primitives";
import { Font } from "../primitives/font";

export type Options = {
  axisColor?: Vector4;
  axisWidth?: number;
  labelAnchor?: Vector2;
  labelAngle?: number;
  labelColor?: Vector4;
  labelPad?: number;
  labelSide?: -1 | 1;
  labelSize?: number;
  tickColor?: Vector4;
  tickLength?: number;
  tickOffset?: number;
  tickWidth?: number;
  minorTicks?: NumberArray;
  minorTickColor?: Vector4;
  minorTickLength?: number;
  minorTickOffset?: number;
  minorTickWidth?: number;
};

const DEFAULTS = {
  axisColor: [0, 0, 0, 1],
  axisWidth: 1,
  labelAngle: 0,
  labelColor: [0, 0, 0, 1],
  labelPad: 3,
  labelSide: -1,
  labelSize: 12,
  tickColor: [0, 0, 0, 1],
  tickLength: 12,
  tickOffset: 0,
  tickWidth: 1,
  minorTickColor: [0, 0, 0, 1],
  minorTickLength: 6,
  minorTickOffset: 0,
  minorTickWidth: 1,
  minorTicks: [],
};

export type Factory = ReturnType<typeof factory>;

export function factory(
  text: primitives.text.Factory,
  vlines: primitives.vlines.Factory,
  hlines: primitives.hlines.Factory,
  lineSegments: primitives.lineSegments.Factory
) {
  return function (
    coords: CoordinateSystem,
    start: Vector2,
    end: Vector2,
    ticks: NumberArray,
    labels: string[],
    font: Font,
    options?: Options
  ): Axis {
    return new Axis(
      text,
      vlines,
      hlines,
      lineSegments,
      coords,
      start,
      end,
      ticks,
      labels,
      font,
      options
    );
  };
}

export class Axis extends Composite {
  private axis: Renderable = [];
  private texts: Renderable = [];
  private ticks: Renderable = [];
  private minorTicks: Renderable = [];

  constructor(
    text: primitives.text.Factory,
    vlines: primitives.vlines.Factory,
    hlines: primitives.hlines.Factory,
    lineSegments: primitives.lineSegments.Factory,
    coords: CoordinateSystem,
    start: Vector2,
    end: Vector2,
    ticks: NumberArray,
    labels: string[],
    font: Font,
    options: Options = {}
  ) {
    super();
    const opts = { ...DEFAULTS, ...options };
    const {
      axisWidth,
      axisColor,
      labelAngle,
      labelPad,
      labelSide,
      labelSize,
      labelColor,
      labelAnchor,
      tickOffset,
      tickLength,
      tickWidth,
      tickColor,
      minorTickOffset,
      minorTickLength,
      minorTickWidth,
      minorTickColor,
    } = opts;

    this.texts = [];
    const tickPoints = [];
    const axisPoints = [...(start as NumberArray), ...(end as NumberArray)];
    const p0p1 = vec2.sub(vec2.create(), end as vec2, start as vec2);
    const dirWorld = vec2.normalize(vec2.create(), p0p1);
    const startScreen = coords.toRange(start) as vec2;
    const endScreen = coords.toRange(end) as vec2;
    const p0p1Screen = vec2.sub(vec2.create(), endScreen, startScreen);
    const orthoScreen = vec2.normalize(
      vec2.create(),
      vec2.fromValues(-p0p1Screen[1], p0p1Screen[0])
    );

    let anchor = labelAnchor as vec2;
    if (!anchor) {
      anchor = vec2.scale(vec2.create(), orthoScreen, labelSide);
      const qAnchor = 1 / Math.max(Math.abs(anchor[0]), Math.abs(anchor[1]));
      vec2.scale(anchor, anchor, qAnchor);
    }

    const labelOpts = {
      align: 0.5,
      anchor: anchor,
      angle: labelAngle,
      color: labelColor,
      size: labelSize,
    };

    for (let tickIndex = 0; tickIndex < ticks.length; tickIndex++) {
      const tick = ticks[tickIndex];
      const label = labels[tickIndex];

      // tickCenter = p0 + dt * direction
      const tickCenterScreen = coords.toRange(
        vec2.add(
          vec2.create(),
          start as vec2,
          vec2.scale(vec2.create(), dirWorld, tick)
        )
      ) as vec2;

      // tickCenterScreen = tickCenterScreen + tickOffset * orthoScreen
      vec2.add(
        tickCenterScreen,
        tickCenterScreen,
        vec2.scale(vec2.create(), orthoScreen, tickOffset)
      );

      // halfTick = 0.5 * tickLength * orthoScreen
      const halfTick = vec2.scale(vec2.create(), orthoScreen, 0.5 * tickLength);

      // hi = tickCenterScreen + halfTick
      const hi = vec2.add(vec2.create(), tickCenterScreen, halfTick);

      // lo = tickCenterScreen - halfTick
      const lo = vec2.sub(vec2.create(), tickCenterScreen, halfTick);

      // Push the tick line.
      tickPoints.push(
        ...(coords.toDomain(lo as Vector2) as NumberArray),
        ...(coords.toDomain(hi as Vector2) as NumberArray)
      );

      // labelPosition = tickCenterScreen + labelSide * (0.5 * tickLength + labelPad) * orthoScreen
      const labelPosition = vec2.add(
        vec2.create(),
        tickCenterScreen,
        vec2.scale(
          vec2.create(),
          orthoScreen,
          -labelSide * (0.5 * tickLength + labelPad)
        )
      );

      this.texts.push(
        text(font, label, coords.toDomain(labelPosition as Vector2), labelOpts)
      );
    }

    // Minor ticks.
    const minorTickPoints = [];
    for (let tickIndex = 0; tickIndex < opts.minorTicks.length; tickIndex++) {
      const tick = opts.minorTicks[tickIndex];

      // tickCenter = p0 + dt * direction
      const tickCenterScreen = coords.toRange(
        vec2.add(
          vec2.create(),
          start as vec2,
          vec2.scale(vec2.create(), dirWorld, tick)
        )
      ) as vec2;

      // tickCenterScreen = tickCenterScreen + tickOffset * orthoScreen
      vec2.add(
        tickCenterScreen,
        tickCenterScreen,
        vec2.scale(vec2.create(), orthoScreen, minorTickOffset)
      );

      // halfTick = 0.5 * tickLength * orthoScreen
      const halfTick = vec2.scale(
        vec2.create(),
        orthoScreen,
        0.5 * minorTickLength
      );

      // hi = tickCenterScreen + halfTick
      const hi = vec2.add(vec2.create(), tickCenterScreen, halfTick);

      // lo = tickCenterScreen - halfTick
      const lo = vec2.sub(vec2.create(), tickCenterScreen, halfTick);

      // Push the tick line.
      minorTickPoints.push(
        ...(coords.toDomain(lo as Vector2) as NumberArray),
        ...(coords.toDomain(hi as Vector2) as NumberArray)
      );
    }

    const verticalAxis = start[0] === end[0];
    const horizontalAxis = start[1] === end[1];

    if (axisPoints.length > 0) {
      if (verticalAxis) {
        this.axis = vlines(segmentsToVlines(axisPoints), {
          widths: axisWidth,
          colors: axisColor,
        });
      } else if (horizontalAxis) {
        this.axis = hlines(segmentsToHlines(axisPoints), {
          widths: axisWidth,
          colors: axisColor,
        });
      } else {
        this.axis = lineSegments(axisPoints, {
          widths: axisWidth,
          colors: axisColor,
        });
      }
    }

    if (tickPoints.length > 0) {
      if (verticalAxis) {
        this.ticks = hlines(segmentsToHlines(tickPoints), {
          widths: tickWidth,
          colors: tickColor,
        });
      } else if (horizontalAxis) {
        this.ticks = vlines(segmentsToVlines(tickPoints), {
          widths: tickWidth,
          colors: tickColor,
        });
      } else {
        this.ticks = lineSegments(tickPoints, {
          widths: tickWidth,
          colors: tickColor,
        });
      }
    }

    if (minorTickPoints.length > 0) {
      if (verticalAxis) {
        this.minorTicks = hlines(segmentsToHlines(minorTickPoints), {
          widths: minorTickWidth,
          colors: minorTickColor,
        });
      } else if (horizontalAxis) {
        this.minorTicks = vlines(segmentsToVlines(minorTickPoints), {
          widths: minorTickWidth,
          colors: minorTickColor,
        });
      } else {
        this.minorTicks = lineSegments(minorTickPoints, {
          widths: tickWidth,
          colors: tickColor,
        });
      }
    }
  }

  public children(): Renderable {
    return [this.axis, this.ticks, this.minorTicks, this.texts];
  }
}

function segmentsToHlines(segments: NumberArray) {
  const hlines: NumberArray = [];
  for (let i = 0; i < segments.length / 4; i++) {
    hlines.push(segments[4 * i + 0], segments[4 * i + 2], segments[4 * i + 1]);
  }
  return hlines;
}

function segmentsToVlines(segments: NumberArray) {
  const vlines: NumberArray = [];
  for (let i = 0; i < segments.length / 4; i++) {
    vlines.push(segments[4 * i + 0], segments[4 * i + 1], segments[4 * i + 3]);
  }
  return vlines;
}
