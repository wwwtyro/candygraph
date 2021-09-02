import CandyGraph, {
  createCircles,
  createLinearScale,
  createLogScale,
  createCartesianCoordinateSystem,
  createLineStrip,
  createDefaultFont,
  createOrthoAxis,
  createGrid,
  createDataset,
} from "../../.."; // skip-doc

// ## Data Reuse

// The default memory management scheme in CandyGraph is to destroy any GPU-side
// data immediately after it's been rendered once. This is handy for ensuring
// that we're not leaking data, but it's not the best for performance if you're
// re-uploading unchanged data to the GPU. In this example we'll take a look at
// a couple of mechanisms for _retaining_ this data so that it's not immediately
// destroyed.

// skip-doc-start
export default async function doc_00500(cg: CandyGraph) {
  const font = await createDefaultFont(cg);

  const primes = [1 / 2, 1 / 3, 1 / 5, 1 / 7, 1 / 11, 1 / 13, 1 / 17, 1 / 19];
  function primenoise(t: number) {
    let sum = 0;
    for (const p of primes) {
      sum += Math.sin(t * p);
    }
    return sum / primes.length;
  }
  // skip-doc-stop

  // First we'll create some data. Nothing exciting here, just noise added to the line
  // `y = x`.
  const xsRaw: number[] = [];
  const ysRaw: number[] = [];
  for (let i = 0; i < 10000; i++) {
    const pn = primenoise(i) * 1000;
    xsRaw.push(i);
    ysRaw.push(i + pn);
  }

  // Previously we'd have fed `xsRaw` and `ysRaw` directly into functions like
  // `cg.lineStrip`. This time, however, we'll upload them to the GPU and keep a
  // handle to them using the `createDataset` function. Once we've done so, we
  // can continue to use them until we invoke their `dispose()` functions. The
  // `createDataset` function returns a `Dataset` object:
  const xs = createDataset(cg, xsRaw);
  const ys = createDataset(cg, ysRaw);

  const viewport = { x: 0, y: 0, width: 384, height: 384 }; // skip-doc

  // Next we'll create some scales and coordinate systems. In this example,
  // we're going to allow the user to switch between a linear and logarithmic
  // y-axis:
  const linx = createLinearScale([0, 10000], [32, viewport.width - 16]);
  const liny = createLinearScale([0, 10000], [24, viewport.height - 16]);
  const logy = createLogScale(10, [1, 10000], [24, viewport.height - 16]);

  const linlin = createCartesianCoordinateSystem(linx, liny);
  const linlog = createCartesianCoordinateSystem(linx, logy);

  // We can also retain higher level constructs, such as an `OrthoAxis`. To do
  // so, we simply invoke its `retain()` function. Doing so will allow us to
  // continue to use them until we invoke their `dispose()` functions. Let's
  // create a set of x and y axes for our linear-linear and linear-log plots:
  const linlinAxis = [
    createOrthoAxis(cg, linlin, "x", font, {
      labelSide: 1,
      tickStep: 1000,
      tickLength: 5,
      tickOffset: -2,
      labelFormatter: (n) => `${n / 1000}K`,
    })
    .retain(),
    createOrthoAxis(cg, linlin, "y", font, {
      tickStep: 1000,
      tickLength: 5,
      tickOffset: 2,
      labelFormatter: (n) => `${n / 1000}K`,
    })
    .retain(),
  ];

  const linlogAxis = [
    createOrthoAxis(cg, linlog, "x", font, {
      labelSide: 1,
      tickStep: 1000,
      tickLength: 5,
      tickOffset: -2,
      labelFormatter: (n) => `${n / 1000}K`,
    })
    .retain(),
    createOrthoAxis(cg, linlog, "y", font, {
      tickStep: 1,
      tickLength: 5,
      tickOffset: 2,
      labelFormatter: (n) => (n >= 1000 ? `${n / 1000}K` : n.toString()),
    })
    .retain(),
  ];

  // Now we'll define a render function that will get invoked when the user
  // changes plot settings. First we'll grab the setting for whether or not the
  // y-axis is linear or logarithmic:
  function render() {
    const linear =
      Array.prototype.filter.call(
        document.getElementsByName("radio-y-axis-500"),
        (e) => e.checked
      )[0].value === "linear";

    // Then we'll determine whether or not this is a scatter plot or a line plot:
    const scatter =
      Array.prototype.filter.call(
        document.getElementsByName("radio-plot-type-500"),
        (e) => e.checked
      )[0].value === "scatter";

    // We'll use the value of `linear` to get the correct coordinate system and
    // axes renderable. Note that since we invoked `retain()` on the elements of
    // each axes renderable, we can simply reuse them each time the `render`
    // function is called.
    const coords = linear ? linlin : linlog;
    const axes = linear ? linlinAxis : linlogAxis;

    // Next we'll use (and reuse!) our `xs` and `ys` `Dataset` objects in a
    // `cg.circles` or `cg.lineStrip` renderable according to the value of
    // `scatter`:
    const data = scatter
      ? createCircles(cg, xs, ys, {
          colors: [1, 0, 0, 0.1],
          radii: 3,
          borderWidths: 0,
        })
      : createLineStrip(cg, xs, ys, {
          colors: [1, 0, 0, 1],
          widths: 0.25,
        });

    // Finally we'll clear our canvas, render the `axes` and `data` objects, and
    // copy them to a conveniently prepared canvas:
    cg.clear([1, 1, 1, 1]);
    cg.render(coords, viewport, [data, axes]);

    cg.copyTo(
      viewport,
      document.getElementById("doc_00500") as HTMLCanvasElement
    );
  }

  // When the user changes the form, re-render:
  document.getElementById("form-500")?.addEventListener("change", function () {
    render();
  });

  // Perform the initial render:
  render();
} // skip-doc

// Okay, here's our plot - change options in the form to see it re-render the same data with different views:

// <form uk-grid id="form-500">
//     <div>
//         <div class="uk-form-label">Y-Axis</div>
//         <div class="uk-form-controls uk-form-controls-text">
//             <label><input class="uk-radio" type="radio" name="radio-y-axis-500" value="linear"> Linear</label><br>
//             <label><input class="uk-radio" type="radio" name="radio-y-axis-500" value="log" checked> Logarithmic</label>
//         </div>
//     </div>
//     <div>
//         <div class="uk-form-label">Plot Type</div>
//         <div class="uk-form-controls uk-form-controls-text">
//             <label><input class="uk-radio" type="radio" name="radio-plot-type-500" value="line"> Line</label><br>
//             <label><input class="uk-radio" type="radio" name="radio-plot-type-500" value="scatter" checked> Scatter</label>
//         </div>
//     </div>
// </form>

// <br>

// <div style="text-align: center">
//   <canvas id="doc_00500" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384>
//   </canvas>
// </div>

// Note that since this data needs to survive for as long as this tutorial page
// exists, we never call `dispose()` on the renderables we created. For the sake
// of completeness, we'll pretend to do that here:
// ```typescript
// linlinAxis[0].dispose();
// linlinAxis[1].dispose();
// linlogAxis[0].dispose();
// linlogAxis[1].dispose();
// xs.dispose();
// ys.dispose();
// ```
