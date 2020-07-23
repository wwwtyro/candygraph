// ### Scatter plot [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00300" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import { CandyGraph } from "../../..";

export default async function ScatterPlot(cg: CandyGraph) {
  // Generate some x & y data.
  const xs = [];
  const ys = [];
  for (let i = 0; i < 10000; i++) {
    const x = Math.random();
    const y = x;
    const d =
      0.8 * (Math.random() - 0.5) * Math.pow(Math.sin(x * Math.PI), 2.0);
    xs.push(x - d);
    ys.push(y + d);
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

  // Render the data as circles and the axes.
  cg.render(coords, viewport, [
    cg.circles(xs, ys, {
      colors: [1, 0.5, 0.0, 1.0],
      radii: 1,
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
  cg.copyTo(viewport, document.getElementById("ex-00300") as HTMLCanvasElement);
}
// skip-doc-stop
