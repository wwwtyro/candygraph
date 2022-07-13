// ### Interleaved Shapes [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-12000" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import CandyGraph, { Dataset, LinearScale, InterleavedShapes, CartesianCoordinateSystem } from "../../../src";

export default function InterleavedShapesExample(cg: CandyGraph) {
  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-12000") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  const viewport = { x: 0, y: 0, width: 384 * dpr, height: 384 * dpr };

  const coords = new CartesianCoordinateSystem(
    cg,
    new LinearScale([0, 1], [0, viewport.width]),
    new LinearScale([0, 1], [0, viewport.height])
  );

  // prettier-ignore
  const shape = new Dataset(cg, [
    -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
    1, -1, 4, 0, 1, 1,
    1, 1, 0, 4, -1, 1,
    -1, -1, -1, 1, -4, 0,
    -1, -1, 0, -4, 1, -1
  ]);

  const xys = [];
  const colors = [];
  const scales = [];
  const rotations = [];
  for (let i = 0; i < 300; i++) {
    xys.push(Math.random(), Math.random());
    colors.push(Math.random(), Math.random(), Math.random(), 1);
    const scale = (1 + Math.random() * 10) * dpr;
    scales.push(scale, scale);
    rotations.push(Math.random() * 2 * Math.PI);
  }

  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    new InterleavedShapes(cg, shape, xys, {
      colors,
      scales,
      rotations,
    }),
  ]);

  cg.copyTo(viewport, document.getElementById("ex-12000") as HTMLCanvasElement);
}
// skip-doc-stop
