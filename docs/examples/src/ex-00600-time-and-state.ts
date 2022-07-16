// ### Animated, background state [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// Click to toggle animation:
//
// <canvas id="ex-00600" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  Triangles,
  Grid,
  OpaqueLineStrip,
  OrthoAxis,
  LinearScale,
  CartesianCoordinateSystem,
} from "../../../src";

export default async function TimeAndState(cg: CandyGraph) {
  // Create a canvas and add it to the page.
  const canvas = document.getElementById("ex-00600") as HTMLCanvasElement;

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
    new LinearScale([-5, 0], [16 * dpr, viewport.width - 32 * dpr]),
    yScale
  );
  const timeCoords = new CartesianCoordinateSystem(
    cg,
    new LinearScale([-5, 0], [16 * dpr, viewport.width - 32 * dpr]),
    yScale
  );

  const font = await createDefaultFont(cg);

  // Make our two axes.
  const axes = [
    new OrthoAxis(cg, axisCoords, "x", font, {
      labelSide: 1,
      tickLength: 6 * dpr,
      tickOffset: -3 * dpr,
      minorTickCount: 4,
      minorTickOffset: -2 * dpr,
      minorTickLength: 3 * dpr,
      minorTickWidth: 1 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    new OrthoAxis(cg, axisCoords, "y", font, {
      axisIntercept: 0,
      labelSide: 1,
      tickOrigin: 0,
      tickStep: 5,
      tickLength: 6 * dpr,
      tickOffset: -3 * dpr,
      minorTickCount: 4,
      minorTickOffset: -2 * dpr,
      minorTickLength: 3 * dpr,
      minorTickWidth: 1 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
  ];

  const grid = [
    new Grid(cg, axes[0].computed.ticks, axes[1].computed.ticks, axisCoords.xscale.domain, axisCoords.yscale.domain, {
      color: [0.5, 0.5, 0.5, 1],
      width: 1 * dpr,
    }),
    new Grid(
      cg,
      axes[0].computed.minorTicks,
      axes[1].computed.minorTicks,
      axisCoords.xscale.domain,
      axisCoords.yscale.domain,
      {
        color: [0.75, 0.75, 0.75, 1],
        width: 1 * dpr,
      }
    ),
  ];

  const xs: number[] = [];
  const y0: number[] = [];
  const y1: number[] = [];
  let states: {
    color: [number, number, number, number];
    timestamp: number;
  }[] = [
    {
      color: [Math.random(), Math.random(), Math.random(), 0.5],
      timestamp: 0,
    },
  ];

  function primenoise(t: number) {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19];
    let sum = 0;
    for (const p of primes) {
      sum += Math.sin(t / p);
    }
    return sum / primes.length;
  }

  function render(time: number) {
    time = time / 1000;

    xs.push(time);
    y0.push(12.5 + 12.5 * primenoise(time * 10));
    y1.push(12.5 + 12.5 * primenoise(time * 20));

    while (xs[0] < time - 5) {
      xs.shift();
      y0.shift();
      y1.shift();
    }

    if (Math.random() < 1 / 150) {
      states.push({
        color: [Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 0.5],
        timestamp: time,
      });
    }
    states = states.filter((_, index) => index === states.length - 1 || states[index + 1].timestamp > time - 5);

    // Update the timeCoords.
    timeCoords.xscale.domain = [time - 5, time];

    // Create the state rects.
    const rects = [];
    for (let i = 0; i < states.length; i++) {
      const t0 = Math.max(time - 5, states[i].timestamp);
      let t1 = time;
      if (i < states.length - 1) {
        t1 = states[i + 1].timestamp;
      }
      rects.push(
        new Triangles(cg, [t0, 0, t1, 0, t1, 25, t0, 0, t1, 25, t0, 25], {
          color: states[i].color,
        })
      );
    }

    // Clear the canvas.
    cg.clear([1, 1, 1, 1]);

    // Render the state rects with the timeCoords.
    cg.render(timeCoords, viewport, rects);

    // Render the grid with the axisCoords.
    cg.render(axisCoords, viewport, grid);

    // Render the traces with the timeCoords.
    cg.render(timeCoords, viewport, [
      new OpaqueLineStrip(cg, xs, y0, { colors: [0.5, 0, 1.0], widths: 2.0 * dpr }),
      new OpaqueLineStrip(cg, xs, y1, { colors: [1.0, 0, 0.5], widths: 2.0 * dpr }),
    ]);

    // Render the axes with the axisCoords.
    cg.render(axisCoords, viewport, axes);

    // Copy to our target canvas.
    cg.copyTo(viewport, canvas);
  }

  let animating = false;
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!animating) {
      return;
    }
    time += 1000 / 60;
    render(time);
  }

  document.getElementById("ex-00600")?.addEventListener("click", function () {
    animating = !animating;
  });

  render(0);
  animate();
}
// skip-doc-stop
