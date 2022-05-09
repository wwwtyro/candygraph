// ### Line plot [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00100" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  createLineStrip,
  createOrthoAxis,
  createLinearScale,
  createCartesianCoordinateSystem,
} from "../../../src";

export default async function SimplePlot(cg: CandyGraph) {
  // Generate some x & y data.
  const xs = [];
  const ys = [];
  for (let x = 0; x <= 1; x += 0.001) {
    xs.push(x);
    ys.push(0.5 + 0.25 * Math.sin(x * 2 * Math.PI));
  }

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-00100") as HTMLCanvasElement;
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
    cg,
    createLinearScale([0, 1], [32 * dpr, viewport.width - 16 * dpr]),
    createLinearScale([0, 1], [32 * dpr, viewport.height - 16 * dpr])
  );

  const font = await createDefaultFont(cg);

  // Clear the viewport.
  cg.clear([1, 1, 1, 1]);

  // Render the a line strip representing the x & y data, and axes.
  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0.5, 0.0, 1.0],
      widths: 3 * dpr,
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
  cg.copyTo(viewport, document.getElementById("ex-00100") as HTMLCanvasElement);
}
