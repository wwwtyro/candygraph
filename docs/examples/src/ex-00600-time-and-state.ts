// ### Animated, background state [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// Click to toggle animation:
//
// <canvas id="ex-00600" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import { CandyGraph } from "../../..";

export default async function TimeAndState(cg: CandyGraph) {
  // Create a canvas and add it to the page.
  const canvas = document.getElementById("ex-00600") as HTMLCanvasElement;

  // The viewport for our plot. Units are pixels.
  const viewport = { x: 0, y: 0, width: canvas.width, height: canvas.height };

  // We'll make two coordinate systems; one for the x-axis, which is relative time,
  // and one for the traces, which are in real time. We'll share the y scale between
  // them.
  const yScale = cg.scale.linear([0, 25], [32, viewport.height - 16]);
  const axisCoords = cg.coordinate.cartesian(
    cg.scale.linear([-5, 0], [16, viewport.width - 32]),
    yScale
  );
  const timeCoords = cg.coordinate.cartesian(
    cg.scale.linear([-5, 0], [16, viewport.width - 32]),
    yScale
  );

  const font = await cg.defaultFont;

  // Make our two axes.
  const axes = [
    cg
      .orthoAxis(axisCoords, "x", font, {
        labelSide: 1,
        tickLength: 6,
        tickOffset: -3,
        minorTickCount: 4,
        minorTickOffset: -2,
        minorTickLength: 3,
      })
      .retain(),
    cg
      .orthoAxis(axisCoords, "y", font, {
        axisIntercept: 0,
        labelSide: 1,
        tickOrigin: 0,
        tickStep: 5,
        tickLength: 6,
        tickOffset: -3,
        minorTickCount: 4,
        minorTickOffset: -2,
        minorTickLength: 3,
      })
      .retain(),
  ];

  const grid = [
    cg
      .grid(
        axes[0].info.ticks,
        axes[1].info.ticks,
        axisCoords.xscale.domain,
        axisCoords.yscale.domain,
        { color: [0.5, 0.5, 0.5, 1] }
      )
      .retain(),
    cg
      .grid(
        axes[0].info.minorTicks,
        axes[1].info.minorTicks,
        axisCoords.xscale.domain,
        axisCoords.yscale.domain,
        { color: [0.75, 0.75, 0.75, 1] }
      )
      .retain(),
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
        color: [Math.random(), Math.random(), Math.random(), 0.5],
        timestamp: time,
      });
    }
    states = states.filter(
      (_, index) =>
        index === states.length - 1 || states[index + 1].timestamp > time - 5
    );

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
        cg.triangles([t0, 0, t1, 0, t1, 25, t0, 0, t1, 25, t0, 25], {
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
      cg.lineStrip(xs, y0, { colors: [0.5, 0, 1.0, 1], widths: 2.0 }),
      cg.lineStrip(xs, y1, { colors: [1.0, 0, 0.5, 1], widths: 2.0 }),
    ]);

    // Render the axes with the axisCoords.
    cg.render(axisCoords, viewport, axes);

    // Copy to our target canvas.
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

  document.getElementById("ex-00600")?.addEventListener("click", function () {
    animating = !animating;
  });

  render(0);
  animate(0);
}
// skip-doc-stop
