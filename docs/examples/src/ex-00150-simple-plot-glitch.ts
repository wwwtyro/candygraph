// ### TransparentLineStrip Glitch [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00150" style="box-shadow: 0px 0px 8px #ccc;" width=800 height=800></canvas>

// skip-doc-start
import CandyGraph, {
  OpaqueLineStrip,
  TransparentLineStrip,
  LinearScale,
  CartesianCoordinateSystem,
} from "../../../src";

export default async function TransparentLineStripGlitch(cg: CandyGraph) {
  const xs1 = [0, 50 - 0.5, 50, 50, 50 + 0.5, 100];
  const xs2 = [100, 150 - 0.5, 150, 150, 150 + 0.5, 200];
  const xs3 = [200, 250 - 9, 250, 250, 250 + 9, 300];
  const xs4 = [300, 350 - 9, 350, 350, 350 + 9, 400];
  const xs5 = [400, 450 - 0.5, 450, 450, 450 + 0.5, 500];
  const xs6 = [500, 550 - 0.5, 550, 550, 550 + 0.5, 600];
  const xs7 = [600, 650 - 9, 650, 650, 650 + 9, 700];
  const xs8 = [700, 750 - 9, 750, 750, 750 + 9, 800];

  const ys = [400, 400, 450, 350, 400, 400];

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-00150") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  // Create a viewport. Units are in pixels.
  const viewport = { x: 0, y: 0, width: 800 * dpr, height: 800 * dpr };

  // Create a coordinate system from two linear scales. Note
  // that we add 32 pixels of padding to the left and bottom
  // of the viewport, and 16 pixels to the top and right.
  const coords = new CartesianCoordinateSystem(
    cg,
    new LinearScale([0, 800], [32 * dpr, viewport.width - 16 * dpr]),
    new LinearScale([0, 800], [32 * dpr, viewport.height - 16 * dpr])
  );

  // Clear the viewport.
  cg.clear([1, 1, 1, 1]);

  // Render the a line strip representing the x & y data, and axes.
  cg.render(coords, viewport, [
    new OpaqueLineStrip(cg, xs1, ys, {
      colors: [0.0, 0.0, 0.0],
      widths: 1 * dpr,
    }),
    new OpaqueLineStrip(cg, xs2, ys, {
      colors: [0.0, 0.0, 0.0],
      widths: 10 * dpr,
    }),
    new OpaqueLineStrip(cg, xs3, ys, {
      colors: [0.0, 0.0, 0.0],
      widths: 1 * dpr,
    }),
    new OpaqueLineStrip(cg, xs4, ys, {
      colors: [0.0, 0.0, 0.0],
      widths: 10 * dpr,
    }),
    new TransparentLineStrip(cg, xs5, ys, {
      color: [0.0, 0.0, 0.0, 0.66],
      width: 1 * dpr,
    }),
    new TransparentLineStrip(cg, xs6, ys, {
      color: [0.0, 0.0, 0.0, 0.66],
      width: 10 * dpr,
    }),
    new TransparentLineStrip(cg, xs7, ys, {
      color: [0.0, 0.0, 0.0, 0.66],
      width: 1 * dpr,
    }),
    new TransparentLineStrip(cg, xs8, ys, {
      color: [0.0, 0.0, 0.0, 0.66],
      width: 10 * dpr,
    }),
  ]);

  console.log("hallo?");

  // Copy the plot to a new canvas and add it to the document.
  cg.copyTo(viewport, document.getElementById("ex-00150") as HTMLCanvasElement);
}
