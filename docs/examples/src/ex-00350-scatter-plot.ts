// ### Scatter plot [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00350" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  createCircles,
  createOrthoAxis,
  createLinearScale,
  createCartesianCoordinateSystem,
} from "../../../src";

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

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-00350") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  // Create a viewport. Units are in pixels.
  const viewport = { x: 0, y: 0, width: 384 * dpr, height: 384 * dpr };

  // Create a coordinate system from two linear scales. Note
  // that we add 32 pixels of padding to the left and bottom
  // of the viewport, and 16 pixels to the top and right.
  const coords = createCartesianCoordinateSystem(
    createLinearScale([0, 1], [32 * dpr, viewport.width - 16 * dpr]),
    createLinearScale([0, 1], [32 * dpr, viewport.height - 16 * dpr])
  );

  const font = await createDefaultFont(cg);

  // Clear the viewport.
  cg.clear([1, 1, 1, 1]);

  // Render the data as circles and the axes.
  cg.render(coords, viewport, [
    createCircles(cg, xs, ys, {
      colors: [1, 0.5, 0.0, 1.0],
      radii: 1 * dpr,
      borderWidths: 0 * dpr,
    }),
    createOrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickOffset: -2.5 * dpr,
      tickLength: 6 * dpr,
      tickStep: 0.2,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,

      labelFormatter: (n) => n.toFixed(1),
    }),
    createOrthoAxis(cg, coords, "y", font, {
      tickOffset: 2.5 * dpr,
      tickLength: 6 * dpr,
      tickStep: 0.2,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,

      labelFormatter: (n) => n.toFixed(1),
    }),
  ]);

  // Copy the plot to a new canvas and add it to the document.
  cg.copyTo(viewport, document.getElementById("ex-00350") as HTMLCanvasElement);
}
// skip-doc-stop
