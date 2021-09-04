// skip-doc-start
import CandyGraph, {
  createLinearScale,
  createLogScale,
  createCartesianCoordinateSystem,
  createLineStrip,
  createDefaultFont,
  createOrthoAxis,
  createGrid,
} from "../../../src";
// skip-doc-stop

// ## Semi-Log Plot

// A semilogarithmic plot is one in which one axis uses a log scale and the
// other a linear scale. Let's take a look at how we'd do that in CandyGraph.

// skip-doc-start
export default async function doc_00300(cg: CandyGraph) {
  const viewport = { x: 0, y: 0, width: 384, height: 384 };
  // skip-doc-stop

  // We'll start with our data. We'll make our x-scale linear and our y-scale
  // logarithmic, so we'll make our y-coordinates span multiple orders of
  // magnitude and our x-coordinates we'll keep between zero and one:
  const xs = [];
  const ys = [];
  for (let x = 0; x <= 1; x += 0.00001) {
    const y = 100000 * x;
    xs.push(x);
    ys.push(y);
  }

  // Then we'll set up our scales. The x-scale should be linear and have a
  // domain of 0 to 1:
  const xscale = createLinearScale([0, 1], [40, viewport.width - 16]);

  // The y-scale should be logarighmic. Here we'll use a base of 10 and a domain
  // of 1 to 100000:
  const yscale = createLogScale(10, [1, 100000], [24, viewport.height - 16]);

  // Then we'll create our coordinate system, grab the default font, clear the
  // canvas, and render our data with axes:
  const coords = createCartesianCoordinateSystem(xscale, yscale);
  const font = await createDefaultFont(cg);

  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickLength: 5,
      tickOffset: -2,
    }),
    createOrthoAxis(cg, coords, "y", font, {
      tickLength: 5,
      tickOffset: 2,
    }),
  ]);

  // <div style="text-align: center">
  //   <canvas id="doc_00300-000" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384>
  //   </canvas>
  // </div>
  //

  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00300-000") as HTMLCanvasElement
  );
  // skip-doc-stop

  // Note that the `OrthoAxis` detected that we're using a logarithmic scale on
  // the y-axis and changed its behavior accordingly. We'll still need to
  // improve the axis rendering, though. Let's make the y-axis more human
  // readable with a `labelFormatter` function and create more dense ticks on
  // the x-axis:

  cg.clear([1, 1, 1, 1]); // skip-doc

  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickLength: 5,
      tickOffset: -2,
      tickStep: 0.2,
      labelFormatter: (n) => n.toFixed(1),
    }),
    createOrthoAxis(cg, coords, "y", font, {
      tickLength: 5,
      tickOffset: 2,
      labelFormatter: (n) =>
        n >= 1000 ? Math.round(n / 1000).toString() + "K" : n.toString(),
    }),
  ]);

  // <div style="text-align: center">
  //   <canvas id="doc_00300-001" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384>
  //   </canvas>
  // </div>
  //

  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00300-001") as HTMLCanvasElement
  );
  // skip-doc-stop

  // We can make the logarithmic nature of the y-axis a little more obvious by
  // adding some minor ticks:

  cg.clear([1, 1, 1, 1]); // skip-doc

  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickLength: 5,
      tickOffset: -2,
      tickStep: 0.2,
      labelFormatter: (n) => n.toFixed(1),
    }),
    createOrthoAxis(cg, coords, "y", font, {
      minorTickCount: 5,
      minorTickLength: 3,
      minorTickOffset: 2,
      tickLength: 5,
      tickOffset: 2,
      labelFormatter: (n) =>
        n >= 1000 ? Math.round(n / 1000).toString() + "K" : n.toString(),
    }),
  ]);

  // <div style="text-align: center">
  //   <canvas id="doc_00300-002" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384>
  //   </canvas>
  // </div>
  //

  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00300-002") as HTMLCanvasElement
  );
  // skip-doc-stop

  // Sometimes it's helpful to display a grid on your plot to make it easier to
  // estimate data values. Let's add one here. First we'll pull out the axes
  // from the render function into a separate variable:

  const axes = [
    createOrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickLength: 5,
      tickOffset: -2,
      tickStep: 0.2,
      labelFormatter: (n) => n.toFixed(1),
    }),
    createOrthoAxis(cg, coords, "y", font, {
      minorTickCount: 5,
      minorTickLength: 3,
      minorTickOffset: 2,
      tickLength: 5,
      tickOffset: 2,
      labelFormatter: (n) =>
        n >= 1000 ? Math.round(n / 1000).toString() + "K" : n.toString(),
    }),
  ];

  // Then we'll access the `info` objects on that variable to build grids with
  // the `Grid` helper CandyGraph provides. First we'll make a grid with our
  // major ticks on both the x- and y-axes:
  const majorGrid = createGrid(
    cg,
    axes[0].info.ticks,
    axes[1].info.ticks,
    coords.xscale.domain,
    coords.yscale.domain,
    { color: [0.25, 0.25, 0.25, 1], width: 1 }
  );

  // Then we'll create a grid for the minor ticks, which we only have on the
  // y-axis, so we'll pass an empty array for the x-axis ticks:
  const minorGrid = createGrid(
    cg,
    [],
    axes[1].info.minorTicks,
    coords.xscale.domain,
    coords.yscale.domain,
    { color: [0.75, 0.75, 0.75, 1] }
  );

  cg.clear([1, 1, 1, 1]); // skip-doc

  // And finally render our graph:
  cg.render(coords, viewport, [
    minorGrid,
    majorGrid,
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    axes,
  ]);

  // <div style="text-align: center">
  //   <canvas id="doc_00300-003" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384>
  //   </canvas>
  // </div>
  //

  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00300-003") as HTMLCanvasElement
  );
  // skip-doc-stop
} // skip-doc
