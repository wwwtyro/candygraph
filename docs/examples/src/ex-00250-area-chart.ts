// ### Area graph [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00250" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import { CandyGraph } from "../../..";

export default async function Area(cg: CandyGraph) {
  // Generate some x & y data.
  const xs = [];
  const ys = [];
  for (let x = 0; x <= 100 + Number.EPSILON; x += 10) {
    xs.push(x);
    ys.push(Math.random() * 50 + 25);
  }

  // Generate a triangle mesh for the area underneath the lines.
  const triangles = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i + 0];
    const x1 = xs[i + 1];
    const y0 = ys[i + 0];
    const y1 = ys[i + 1];
    triangles.push(x0, 0, x1, 0, x1, y1, x0, 0, x1, y1, x0, y0);
  }

  // Create a viewport. Units are in pixels.
  const viewport = { x: 0, y: 0, width: 384, height: 384 };

  // Create a coordinate system from two linear scales. Note
  // that we add 32 pixels of padding to the left and bottom
  // of the viewport, and 16 pixels to the top and right.
  const coords = cg.coordinate.cartesian(
    cg.scale.linear([0, 100], [32, viewport.width - 16]),
    cg.scale.linear([0, 100], [32, viewport.height - 16])
  );

  const font = await cg.defaultFont;

  // Clear the viewport.
  cg.clear([1, 1, 1, 1]);

  // Render the a line strip representing the x & y data, and axes.
  cg.render(coords, viewport, [
    cg.triangles(triangles, { color: [0, 0.5, 1, 0.25] }),
    cg.lineStrip(xs, ys, {
      colors: [0, 0.5, 1, 1],
      widths: 2,
    }),
    cg.orthoAxis(coords, "x", font, {
      labelSide: 1,
      tickOffset: -2.5,
      tickLength: 6,
      tickStep: 10,
    }),
    cg.orthoAxis(coords, "y", font, {
      tickOffset: 2.5,
      tickLength: 6,
      tickStep: 10,
    }),
  ]);

  // Copy the plot to a new canvas and add it to the document.
  cg.copyTo(viewport, document.getElementById("ex-00250") as HTMLCanvasElement);
}
// skip-doc-stop
