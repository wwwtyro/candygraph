// ### Interleaved Shapes [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-12000" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import { CandyGraph } from "../../..";

export default function InterleavedShapes(cg: CandyGraph) {
  const viewport = { x: 0, y: 0, width: 384, height: 384 };

  const coords = cg.coordinate.cartesian(
    cg.scale.linear([0, 1], [0, viewport.width]),
    cg.scale.linear([0, 1], [0, viewport.height])
  );

  // prettier-ignore
  const shape = cg.reusableData([
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
    const scale = 1 + Math.random() * 10;
    scales.push(scale, scale);
    rotations.push(Math.random() * 2 * Math.PI);
  }

  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    cg.interleavedShapes(shape, xys, {
      colors,
      scales,
      rotations,
    }),
  ]);

  cg.copyTo(viewport, document.getElementById("ex-12000") as HTMLCanvasElement);
}
// skip-doc-stop
