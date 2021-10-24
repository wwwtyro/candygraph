// skip-doc-start
import CandyGraph, {
  createLinearScale,
  createCartesianCoordinateSystem,
  createLineStrip,
  createDefaultFont,
  createOrthoAxis,
  createScissor,
} from "../../../src";
// skip-doc-stop

// ## Animation

// Now we'll cover basic animation in CandyGraph. It's nothing surprising - each
// animation frame we'll clear the canvas, update the data we're going to
// render, and then render it. While this isn't the absolute fastest way to
// render animations in CandyGraph, it's still very fast and can handle even
// large datasets (up to ~400K points at 60 fps) on a midrange 2020 desktop PC.

// skip-doc-next
export default async function doc_00400(cg: CandyGraph) {
  // For this example, we'll plot a smooth noise function over time. We'll not
  // go into the details of how the following function works, but you can find
  // the inspiration for it
  // [here](https://www.sitepoint.com/the-cicada-principle-and-why-it-matters-to-web-designers/).
  const primes = [1 / 2, 1 / 3, 1 / 5, 1 / 7, 1 / 11, 1 / 13, 1 / 17, 1 / 19];
  function primenoise(t: number) {
    let sum = 0;
    for (const p of primes) {
      sum += Math.sin(t * p);
    }
    return sum / primes.length;
  }

  // For each trace in our plot, we'll use 1000 data points covering 10 seconds
  // of data:
  const pointCount = 1000;
  const history = 10;

  // We'll define a wide viewport and a linear/linear cartesian coordinate
  // system with a bit of padding for our axes:
  const viewport = { x: 0, y: 0, width: 1024, height: 384 };
  const coords = createCartesianCoordinateSystem(
    createLinearScale([-history, 0], [40, viewport.width - 16]),
    createLinearScale([-1, 1], [32, viewport.height - 16])
  );

  // Next we'll create some arrays to store our plot data:
  const xs = new Float32Array(pointCount);
  const ys0 = new Float32Array(pointCount);
  const ys1 = new Float32Array(pointCount);

  // And a couple of variables to keep track of the time:
  let time = 0;
  let lastTime = performance.now() / 1000;

  // Grab the default font.
  const font = await createDefaultFont(cg);

  // Next up is our render function. We'll track the wall-clock time in order to
  // handle displays that don't update at a fixed 60 fps, but we'll clamp to a
  // maximum timestep of 1/60 seconds.
  function render() {
    const now = performance.now() / 1000;
    const dt = Math.min(1 / 60, now - lastTime);
    lastTime = now;
    time += dt;

    // We'll just completely rebuild our data each frame. This is slow, but fast
    // enough for our purposes here.
    for (let i = 0; i < pointCount; i++) {
      xs[i] = time - history + (history * (i + 1)) / pointCount;
      ys0[i] = primenoise(xs[i] * 16);
      ys1[i] = primenoise(xs[i] * 16 + 5000);
    }

    // We need to shift the domain of the x-scale as time progresses in order to
    // keep the last `history` seconds in view:
    coords.xscale.domain = [time - history, time];

    // Now we'll clear our canvas and render:
    cg.clear([1, 1, 1, 1]);
    cg.render(coords, viewport, [
      // First we'll render our plot data. We have two traces to render, `ys0`
      // and `ys1`. We'll get a little fancy and render a black border around
      // each trace by first rendering a thick black line, then a thinner line
      // in our desired color. We'll also apply a scissor in screen space to
      // confine the lines to the plot region. First the `ys0` trace in ~orange:
      createScissor(cg, 40, 32, viewport.width - 56, viewport.height - 48, true, [
        createLineStrip(cg, xs, ys0, {
          colors: [0, 0, 0, 1],
          widths: 17,
        }),
        createLineStrip(cg, xs, ys0, {
          colors: [1, 0.5, 0, 1],
          widths: 9,
        }),
        // Then our `ys1` trace in ~blue:
        createLineStrip(cg, xs, ys1, {
          colors: [0, 0, 0, 1],
          widths: 17,
        }),
        createLineStrip(cg, xs, ys1, {
          colors: [0, 0.5, 1, 1],
          widths: 9,
        }),
      ]),
      // Then we'll render our axes. Note that for the y-axis we're shifting the
      // `axisIntercept` to keep up with the current time:
      createOrthoAxis(cg, coords, "x", font, {
        labelSide: 1,
        tickLength: 5,
        tickOffset: -2,
        tickStep: 1,
        labelFormatter: (n) => n.toFixed(0),
      }),
      createOrthoAxis(cg, coords, "y", font, {
        axisIntercept: time - history,
        tickStep: 0.5,
        tickLength: 5,
        tickOffset: 2,
        labelFormatter: (n) => n.toFixed(1),
      }),
    ]);

    // Finally, we'll copy our rendered plot to a canvas that's already been
    // added to this document:
    cg.copyTo(viewport, document.getElementById("doc_00400") as HTMLCanvasElement);
  }

  // Here's some interaction and animation loop odds and ends to tie everything up:
  let animating = false;

  function animate() {
    requestAnimationFrame(animate);
    if (!animating) {
      return;
    }
    render();
  }

  document.getElementById("doc_00400")?.addEventListener("click", function () {
    animating = !animating;
  });

  render();
  animate();
} // skip-doc

// And here's our animated plot! Click/tap on the plot to toggle animation:

// <div style="text-align: center">
//   <canvas id="doc_00400" style="box-shadow: 0px 0px 8px #ccc;" width=1024 height=384>
//   </canvas>
// </div>
