// ### Simple line plot with points [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00200" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import { CandyGraph } from "../../..";

export default async function SimplePlotPoints(cg: CandyGraph) {
  // Generate some x & y data.
  const xs = [];
  const ys = [];
  for (let x = 0; x <= 1 + Number.EPSILON; x += 0.05) {
    xs.push(x);
    ys.push(0.5 + 0.25 * Math.sin(x * 2 * Math.PI));
  }

  // Create a viewport. Units are in pixels.
  const viewport = { x: 0, y: 0, width: 384, height: 384 };

  // Create a coordinate system from two linear scales. Note
  // that we add 32 pixels of padding to the left and bottom
  // of the viewport, and 16 pixels to the top and right.
  const coords = cg.coordinate.cartesian(
    cg.scale.linear([0, 1], [32, viewport.width - 16]),
    cg.scale.linear([0, 1], [32, viewport.height - 16])
  );

  const font = await cg.defaultFont;

  // Clear the viewport.
  cg.clear([1, 1, 1, 1]);

  // Render the a line strip representing the x & y data, and axes.
  cg.render(coords, viewport, [
    cg.lineStrip(xs, ys, {
      colors: [1, 0.5, 0, 1],
      widths: 3,
    }),
    cg.circles(xs, ys, {
      colors: [1, 0.5, 0, 1],
      radii: 6.0,
      borderWidths: 0,
    }),
    cg.circles(xs, ys, {
      colors: [1, 1, 1, 1],
      radii: 3.0,
      borderWidths: 0,
    }),
    cg.orthoAxis(coords, "x", font, {
      labelSide: 1,
      tickOffset: -2.5,
      tickLength: 6,
      tickStep: 0.2,
      labelFormatter: (n) => n.toFixed(1),
    }),
    cg.orthoAxis(coords, "y", font, {
      tickOffset: 2.5,
      tickLength: 6,
      tickStep: 0.2,
      labelFormatter: (n) => n.toFixed(1),
    }),
  ]);

  // Copy the plot to a new canvas and add it to the document.
  cg.copyTo(viewport, document.getElementById("ex-00200") as HTMLCanvasElement);
}
// skip-doc-stop
