// ### Pie chart [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00375" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import { CandyGraph } from "../../../lib";

export default async function PieChart(cg: CandyGraph) {
  const font = await cg.defaultFont;
  const viewport = { x: 0, y: 0, width: 384, height: 384 };

  // Generate a handful of wedges.
  const angles = [];
  const colors = [];
  const text = [];
  let theta = 0;
  for (let i = 0; i < 4; i++) {
    const step = Math.random() + 0.5;
    angles.push(theta);
    angles.push(step);
    text.push(
      cg.text(font, `${Math.round((100 * step) / (2 * Math.PI))}%`, [
        0.5 * Math.cos(theta + 0.5 * step),
        0.5 * Math.sin(theta + 0.5 * step),
      ])
    );
    theta += step;
    colors.push(
      Math.random() * 0.5 + 0.5,
      Math.random() * 0.5 + 0.5,
      Math.random() * 0.5 + 0.5,
      1.0
    );
  }
  angles.push(theta);
  const step = 2 * Math.PI - theta;
  angles.push(step);
  text.push(
    cg.text(font, `${Math.round((100 * step) / (2 * Math.PI))}%`, [
      0.6 * Math.cos(theta + 0.5 * step),
      0.6 * Math.sin(theta + 0.5 * step),
    ])
  );
  colors.push(
    Math.random() * 0.5 + 0.5,
    Math.random() * 0.5 + 0.5,
    Math.random() * 0.5 + 0.5,
    1.0
  );
  // prettier-ignore
  const positions = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0.1 * Math.cos(theta + 0.5 * step),
    0.1 * Math.sin(theta + 0.5 * step),
  ];

  const coords = cg.coordinate.cartesian(
    cg.scale.linear([-1, 1], [0, viewport.width]),
    cg.scale.linear([-1, 1], [0, viewport.height])
  );

  // Clear the viewport.
  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    cg.wedges(positions, angles, {
      colors,
      radii: 128,
    }),
    text,
  ]);

  // Copy the plot to a new canvas and add it to the document.
  cg.copyTo(viewport, document.getElementById("ex-00375") as HTMLCanvasElement);
}
// skip-doc-stop