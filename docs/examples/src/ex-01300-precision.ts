// ### Precision [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-01300" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=450></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  OpaqueLineStrip,
  OrthoAxis,
  LinearScale,
  CartesianCoordinateSystem,
} from "../../../src";

export default async function PrecisionPlot(cg: CandyGraph) {
  // Generate some x & y data.
  const xs = [];
  const ys = [];
  const t0 = Date.now();
  for (let x = t0; x <= t0 + 1; x += 0.001) {
    xs.push(x); // Note that we're creating data that would have precision artifacts if we plotted it as-is.
    ys.push(0.5 + 0.25 * Math.sin(x * 2 * Math.PI));
  }

  // We'll offset our x-data by -t0 to bring it back closer to one. Plotting this dataset will not have precision artifacts.
  for (let i = 0; i < xs.length; i++) {
    xs[i] -= t0;
  }

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-01300") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  // Create a viewport. Units are in pixels.
  const viewport = { x: 0, y: 0, width: canvas.width * dpr, height: canvas.height * dpr };

  // Create a coordinate system from two linear scales.
  const coords = new CartesianCoordinateSystem(
    cg,
    new LinearScale([0, 1], [56 * dpr, viewport.width - 16 * dpr]),
    new LinearScale([0, 1], [108 * dpr, viewport.height - 24 * dpr])
  );

  const font = await createDefaultFont(cg);

  // Clear the viewport.
  cg.clear([1, 1, 1, 1]);

  // Render the a line strip representing the x & y data, and axes.
  cg.render(coords, viewport, [
    new OpaqueLineStrip(cg, xs, ys, {
      colors: [1, 0.5, 0.0],
      widths: 3 * dpr,
    }),
    new OrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickOffset: -2.5 * dpr,
      tickLength: 6 * dpr,
      tickStep: 0.2,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
      labelAnchor: [1, 0],
      labelAngle: 0.35 * Math.PI,
      // Correct the labels appropriate for our -t0 offset:
      labelFormatter: (n) => (n + t0).toFixed(1),
    }),
    new OrthoAxis(cg, coords, "y", font, {
      tickOffset: 2.5 * dpr,
      tickLength: 6 * dpr,
      tickStep: 0.2,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
      labelFormatter: (n) => n.toFixed(3),
    }),
  ]);

  // Copy the plot to a new canvas and add it to the document.
  cg.copyTo(viewport, document.getElementById("ex-01300") as HTMLCanvasElement);
}
