// ### Pie chart [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00375" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  createWedges,
  createText,
  createLinearScale,
  createCartesianCoordinateSystem,
} from "../../../src";

export default async function PieChart(cg: CandyGraph) {
  const font = await createDefaultFont(cg);

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-00375") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  const viewport = { x: 0, y: 0, width: 384 * dpr, height: 384 * dpr };

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
      createText(
        cg,
        font,
        `${Math.round((100 * step) / (2 * Math.PI))}%`,
        [0.5 * Math.cos(theta + 0.5 * step), 0.5 * Math.sin(theta + 0.5 * step)],
        { size: 12 * dpr }
      )
    );
    theta += step;
    colors.push(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1.0);
  }
  angles.push(theta);
  const step = 2 * Math.PI - theta;
  angles.push(step);
  text.push(
    createText(
      cg,
      font,
      `${Math.round((100 * step) / (2 * Math.PI))}%`,
      [0.6 * Math.cos(theta + 0.5 * step), 0.6 * Math.sin(theta + 0.5 * step)],
      { size: 12 * dpr }
    )
  );
  colors.push(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1.0);
  // prettier-ignore
  const positions = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0.1 * Math.cos(theta + 0.5 * step),
    0.1 * Math.sin(theta + 0.5 * step),
  ];

  const coords = createCartesianCoordinateSystem(
    cg,
    createLinearScale([-1, 1], [0, viewport.width]),
    createLinearScale([-1, 1], [0, viewport.height])
  );

  // Clear the viewport.
  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    createWedges(cg, positions, angles, {
      colors,
      radii: 128 * dpr,
    }),
    text,
  ]);

  // Copy the plot to a new canvas and add it to the document.
  cg.copyTo(viewport, document.getElementById("ex-00375") as HTMLCanvasElement);
}
// skip-doc-stop
