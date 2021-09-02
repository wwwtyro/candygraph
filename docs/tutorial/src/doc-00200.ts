import CandyGraph, {
  createLinearScale,
  createCartesianCoordinateSystem,
  createLineStrip,
  createDefaultFont,
  createOrthoAxis,
} from "../../.."; // skip-doc

// ## Axes

// Congratulations, you've just rendered your first CandyGraph plot! There's
// some stuff missing, though. Let's add some axes.

// skip-doc-start
export default async function doc_00200(cg: CandyGraph) {
  const viewport = { x: 0, y: 0, width: 512, height: 384 };

  const xscale = createLinearScale([0, 2 * Math.PI], [0, viewport.width]);
  const yscale = createLinearScale([-1, 1], [0, viewport.height]);

  const coords = createCartesianCoordinateSystem(xscale, yscale);

  const xs = [];
  const ys = [];
  for (let x = 0; x <= 2 * Math.PI; x += 0.01) {
    xs.push(x);
    ys.push(Math.sin(x));
  }

  // skip-doc-stop

  // While you can build axes out of CandyGraph primitives yourself, CandyGraph
  // also provides some handy helpers for common tasks. One of those is the
  // `OrthoAxis`. Let's try adding one for each axis. Note that we're rendering
  // the axes _after_ the line strip. We do this so that we don't obscure our
  // axes with our line plot. This is simply an arbitrary artistic choice we're
  // making, but the point is that CandyGraph uses the painter's algorithm to
  // render items - whatever you render first can be occluded by what you render
  // later. First we'll grab the default font:

  const font = await createDefaultFont(cg);

  // Then render our data and axes:

  cg.clear([1, 1, 1, 1]); // skip-doc

  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font),
    createOrthoAxis(cg, coords, "y", font),
  ]);

  // <div style="text-align: center">
  //   <canvas id="doc_00200-000" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384>
  //   </canvas>
  // </div>
  //

  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00200-000") as HTMLCanvasElement
  );
  // skip-doc-stop

  // Wait, don't run away! It looks ugly, but there's a method to this madness.
  // Let's see if we can patch this up. First off, the axes are right at the
  // edge of the canvas. To address this, we can adjust our scales so that
  // there's some padding in the range. Let's add 24 pixels of padding to the
  // left and bottom of our plot, and 16 pixels to the top and right:
  xscale.range = [24, viewport.width - 16];
  yscale.range = [24, viewport.height - 16];

  // <div style="text-align: center">
  //   <canvas id="doc_00200-001" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384>
  //   </canvas>
  // </div>
  //

  // skip-doc-start
  cg.clear([1, 1, 1, 1]);
  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font),
    createOrthoAxis(cg, coords, "y", font),
  ]);
  cg.copyTo(
    viewport,
    document.getElementById("doc_00200-001") as HTMLCanvasElement
  );
  // skip-doc-stop

  // Okay, we can at least see our axes now. There's still issues, though. The
  // labels for the x-axis are in an inconvenient place. We can adjust that with
  // the `labelSide` option, which takes a 1 or -1 to indicate which side of the
  // axis we want to place the labels.

  cg.clear([1, 1, 1, 1]); // skip-doc
  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font, { labelSide: 1 }),
    createOrthoAxis(cg, coords, "y", font),
  ]);
  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00200-002") as HTMLCanvasElement
  );
  // skip-doc-stop

  // <div style="text-align: center">
  //   <canvas id="doc_00200-002" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384>
  //   </canvas>
  // </div>
  //

  // Better! The y-axis tick density is a little low though. Let's give ourself
  // a little more padding on the left and change the `tickStep` parameter to
  // something more dense than the default of one:

  xscale.range = [40, viewport.width - 16];

  cg.clear([1, 1, 1, 1]); // skip-doc
  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font, { labelSide: 1 }),
    createOrthoAxis(cg, coords, "y", font, { tickStep: 0.25 }),
  ]);
  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00200-003") as HTMLCanvasElement
  );
  // skip-doc-stop

  // <div style="text-align: center">
  //   <canvas id="doc_00200-003" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384>
  //   </canvas>
  // </div>
  //

  // Hmm. The format of the numbers on the y-axis is inconsistent. Let's provide
  // a function to the `labelFormatter` parameter to clean that up:

  cg.clear([1, 1, 1, 1]); // skip-doc
  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font, { labelSide: 1 }),
    createOrthoAxis(cg, coords, "y", font, {
      tickStep: 0.25,
      labelFormatter: (n: number) => n.toFixed(2),
    }),
  ]);
  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00200-004") as HTMLCanvasElement
  );
  // skip-doc-stop

  // <div style="text-align: center">
  //   <canvas id="doc_00200-004" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384>
  //   </canvas>
  // </div>
  //

  // The way the end of the x-axis hangs off the last tick isn't particularly
  // appealing. Let's fix that:

  cg.clear([1, 1, 1, 1]); // skip-doc
  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickStep: 0.25 * Math.PI,
      labelFormatter: (n: number) => n.toFixed(2),
    }),
    createOrthoAxis(cg, coords, "y", font, {
      tickStep: 0.25,
      labelFormatter: (n: number) => n.toFixed(2),
    }),
  ]);
  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00200-005") as HTMLCanvasElement
  );
  // skip-doc-stop

  // <div style="text-align: center">
  //   <canvas id="doc_00200-005" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384>
  //   </canvas>
  // </div>
  //

  // Think the default ticks are a little _meh_? We can adjust those too:

  cg.clear([1, 1, 1, 1]); // skip-doc
  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
    createOrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickStep: 0.25 * Math.PI,
      tickLength: 5,
      tickOffset: -2,
      labelFormatter: (n: number) => n.toFixed(2),
    }),
    createOrthoAxis(cg, coords, "y", font, {
      tickStep: 0.25,
      tickLength: 5,
      tickOffset: 2,
      labelFormatter: (n: number) => n.toFixed(2),
    }),
  ]);
  // skip-doc-start
  cg.copyTo(
    viewport,
    document.getElementById("doc_00200-006") as HTMLCanvasElement
  );
  // skip-doc-stop

  // <div style="text-align: center">
  //   <canvas id="doc_00200-006" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384>
  //   </canvas>
  // </div>
  //
} // skip-doc

// There are a lot more ways to configure axes. Take a look at the `OrthoAxis`
// and `Axis` API documentation for more details, or keep reading, we'll hit
// more use cases below!
