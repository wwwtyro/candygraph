// ### Animated, relative time [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// Click to toggle animation:
//
// <canvas id="ex-00500" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  Grid,
  OrthoAxis,
  LinearScale,
  CartesianCoordinateSystem,
  LineStrip,
} from "../../../src";

export default async function RelativeTime(cg: CandyGraph) {
  const HISTORY = 1.0; // Seconds of history to keep
  const TRACE_LENGTH = 5; // Number of seconds for each trace
  const TRACE_RESOLUTION = 100; // Number of points per trace

  // Keep track of the traces.
  let traces: ReturnType<typeof createTrace>[] = [];

  // Create a canvas and add it to the page.
  const canvas = document.getElementById("ex-00500") as HTMLCanvasElement;

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  // The viewport for our plot. Units are pixels.
  const viewport = { x: 0, y: 0, width: canvas.width, height: canvas.height };

  // We'll make two coordinate systems; one for the x-axis, which is relative time,
  // and one for the traces, which are in real time. We'll share the y scale between
  // them.
  const yScale = new LinearScale([0, 25], [32 * dpr, viewport.height - 16 * dpr]);
  const axisCoords = new CartesianCoordinateSystem(
    cg,
    new LinearScale([-1, 5], [16 * dpr, viewport.width - 16 * dpr]),
    yScale
  );
  const timeCoords = new CartesianCoordinateSystem(
    cg,
    new LinearScale([-1, 5], [16 * dpr, viewport.width - 16 * dpr]),
    yScale
  );

  const font = await createDefaultFont(cg);

  // Make our two axes.
  const axes = [
    new OrthoAxis(cg, axisCoords, "x", font, {
      labelSide: 1,
      tickOffset: -3 * dpr,
      tickLength: 6 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    new OrthoAxis(cg, axisCoords, "y", font, {
      axisIntercept: 0,
      labelAnchor: [1, 1.25],
      tickOrigin: 0,
      tickStep: 5,
      tickLength: 0,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,

      labelFormatter: (n: number) => (n === 0 ? "" : n.toString()),
    }),
  ];

  const grid = new Grid(
    cg,
    axes[0].computed.ticks,
    axes[1].computed.ticks,
    axisCoords.xscale.domain,
    axisCoords.yscale.domain,
    { width: 1 * dpr }
  );

  function primenoise(t: number) {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19];
    let sum = 0;
    for (const p of primes) {
      sum += Math.sin(t / p);
    }
    return sum / primes.length;
  }

  // Make a new trace. This is just a line strip with an associated
  // timestamp. We'll make it change as a function of time to make
  // the animation obvious.
  function createTrace(time: number) {
    const xs = [];
    const ys = [];
    const y0 = 12.5 + 12.5 * primenoise(32 * time);
    for (let i = 0; i < TRACE_RESOLUTION; i++) {
      const x = (TRACE_LENGTH * i) / (TRACE_RESOLUTION - 1);
      const y = y0 + 12.5 * primenoise(4 * x + 32 * time);
      xs.push(x + time);
      ys.push(y);
    }
    return {
      timestamp: time,
      trace: new LineStrip(cg, xs, ys, {
        colors: [1, 0, 1, 1],
        widths: 3.0 * dpr,
      }),
    };
  }

  function render(time: number) {
    time = time / 1000;

    traces.push(createTrace(time));

    // Remove old traces.
    traces = traces.filter((trace) => {
      if (time - trace.timestamp > HISTORY) {
        trace.trace.dispose();
        return false;
      }
      return true;
    });

    // Update the styling according to the age of the trace. Skip
    // the most recently added trace.
    for (let i = 0; i < traces.length - 1; i++) {
      const trace = traces[i];
      const age = time - trace.timestamp;
      trace.trace.colors.update([0, 0, 0, 0.5 * (1 - age / HISTORY)])
      trace.trace.widths.update(1 * dpr);
    }

    // Update the timeCoords.
    timeCoords.xscale.domain = [time - 1, time + 5];

    // Clear the canvas.
    cg.clear([1, 1, 1, 1]);

    // Render the grid with the relative time coordinate system.
    cg.render(axisCoords, viewport, grid);

    // Render the traces with the real time coordinate system.
    cg.render(
      timeCoords,
      viewport,
      traces.map((trace) => trace.trace)
    );

    // Render the axes with the relative time coordinate system.
    cg.render(axisCoords, viewport, axes);

    // Copy to our canvas.
    cg.copyTo(viewport, canvas);
  }

  let animating = false;

  function animate(time: number) {
    requestAnimationFrame(animate);
    if (!animating) {
      return;
    }
    render(time);
  }

  document.getElementById("ex-00500")?.addEventListener("click", function () {
    animating = !animating;
  });

  render(0);
  animate(0);
}
// skip-doc-stop
