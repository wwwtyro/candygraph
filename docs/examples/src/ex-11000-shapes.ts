// ### Shapes [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-11000" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import { CandyGraph } from "../../..";

export default function Shapes(cg: CandyGraph) {
  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-11000") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  const viewport = { x: 0, y: 0, width: 384 * dpr, height: 384 * dpr };

  const coords = cg.coordinate.cartesian(
    cg.scale.linear([0, 2 * Math.PI], [0, viewport.width]),
    cg.scale.linear([-1, 1], [0, viewport.height])
  );

  // prettier-ignore
  const shape = cg.reusableData([
    -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
    1, -1, 4, 0, 1, 1,
    1, 1, 0, 4, -1, 1,
    -1, -1, -1, 1, -4, 0,
    -1, -1, 0, -4, 1, -1
  ]);

  const xs = [];
  const ys0 = [];
  const ys1 = [];
  const colors = [];
  const scales = [];
  const rotations = [];
  for (let x = 0; x <= 2 * Math.PI; x += 0.1) {
    xs.push(x);
    ys0.push(Math.sin(x));
    ys1.push(Math.cos(x));
    colors.push(
      Math.random() * 0.75 + 0.25,
      Math.random() * 0.75 + 0.25,
      Math.random() * 0.75 + 0.25,
      1
    );
    const scale = (1 + Math.random() * 2) * dpr;
    scales.push(scale, scale);
    rotations.push(Math.random() * 2 * Math.PI);
  }

  const xData = cg.reusableData(xs);

  cg.clear([0, 0, 0.25, 1]);

  cg.render(coords, viewport, [
    cg.lineStrip(xData, ys0, {
      colors: [1, 1, 1, 1],
      widths: 2 * dpr,
    }),
    cg.shapes(shape, xData, ys0, {
      colors,
      scales,
      rotations,
    }),
    cg.lineStrip(xData, ys1, {
      colors: [1, 1, 1, 1],
      widths: 2 * dpr,
    }),
    cg.shapes(shape, xData, ys1, {
      colors,
      scales,
      rotations,
    }),
  ]);

  cg.copyTo(viewport, document.getElementById("ex-11000") as HTMLCanvasElement);
}
// skip-doc-stop
