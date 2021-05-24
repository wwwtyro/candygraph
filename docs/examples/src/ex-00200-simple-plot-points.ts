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

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-00200") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  // Create a viewport. Units are in pixels.
  const viewport = { x: 0, y: 0, width: 384 * dpr, height: 384 * dpr };

  // Create a coordinate system from two linear scales. Note
  // that we add 32 pixels of padding to the left and bottom
  // of the viewport, and 16 pixels to the top and right.
  const coords = cg.coordinate.cartesian(
    cg.scale.linear([0, 1], [32 * dpr, viewport.width - 16 * dpr]),
    cg.scale.linear([0, 1], [32 * dpr, viewport.height - 16 * dpr])
  );

  const font = await cg.defaultFont;

  // Clear the viewport.
  cg.clear([0, 0, 0.25, 1]);

  // Render the a line strip representing the x & y data, and axes.
  cg.render(coords, viewport, [
    cg.lineStrip(xs, ys, {
      colors: [1, 0.5, 0, 1],
      widths: 3 * dpr,
    }),
    cg.circles(xs, ys, {
      colors: [1, 0.5, 0, 1],
      radii: 6.0 * dpr,
      borderWidths: 0 * dpr,
    }),
    cg.circles(xs, ys, {
      colors: [0, 0, 0.25, 1],
      radii: 3.0 * dpr,
      borderWidths: 0 * dpr,
    }),
    cg.orthoAxis(coords, "x", font, {
      axisColor: [1, 1, 1, 1],
      labelSide: 1,
      labelColor: [1, 1, 1, 1],
      labelFormatter: (n) => n.toFixed(1),
      tickColor: [1, 1, 1, 1],
      tickOffset: -2.5 * dpr,
      tickLength: 6 * dpr,
      tickStep: 0.2,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    cg.orthoAxis(coords, "y", font, {
      axisColor: [1, 1, 1, 1],
      tickOffset: 2.5 * dpr,
      tickLength: 6 * dpr,
      tickStep: 0.2,
      tickColor: [1, 1, 1, 1],
      labelColor: [1, 1, 1, 1],
      labelFormatter: (n) => n.toFixed(1),
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
  ]);

  // Copy the plot to a new canvas and add it to the document.
  cg.copyTo(viewport, document.getElementById("ex-00200") as HTMLCanvasElement);
}
// skip-doc-stop
