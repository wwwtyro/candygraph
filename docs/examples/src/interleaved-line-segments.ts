import { CandyGraph } from "../../..";

export default function InterleavedLineSegments(cg: CandyGraph) {
  const viewport = { x: 0, y: 0, width: 384, height: 384 };

  const coords = cg.coordinate.cartesian(
    cg.scale.linear([0, 1], [0, viewport.width]),
    cg.scale.linear([0, 1], [0, viewport.height])
  );

  const points = [];
  const colors = [];
  const widths = [];
  for (let i = 0; i < 10000; i++) {
    points.push(Math.random(), Math.random());
    colors.push(Math.random(), Math.random(), Math.random(), 0.25);
    widths.push(Math.random() * 10 + 1);
  }

  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    cg.lineSegments(points, {
      colors,
      widths,
    }),
  ]);

  document.body.appendChild(cg.copyTo(viewport));
}
