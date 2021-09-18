// ### Line segments [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-10000" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import CandyGraph, {
  createLinearScale,
  createLineSegments,
  createCartesianCoordinateSystem,
} from "../../../src";

export default function InterleavedLineSegments(cg: CandyGraph) {
  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-10000") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  const viewport = { x: 0, y: 0, width: 384 * dpr, height: 384 * dpr };

  const coords = createCartesianCoordinateSystem(
    createLinearScale([0, 1], [0, viewport.width]),
    createLinearScale([0, 1], [0, viewport.height])
  );

  const points = [];
  const colors = [];
  const widths = [];
  for (let i = 0; i < 10000; i++) {
    points.push(Math.random(), Math.random());
    colors.push(Math.random(), Math.random(), Math.random(), 0.25);
    widths.push((Math.random() * 10 + 1) * dpr);
  }

  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    createLineSegments(cg, points, {
      colors,
      widths,
    }),
  ]);

  cg.copyTo(viewport, document.getElementById("ex-10000") as HTMLCanvasElement);
}
// skip-doc-stop
