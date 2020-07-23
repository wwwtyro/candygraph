// ### Logarithmic Y-Axis [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00400" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import { CandyGraph } from "../../..";

export default async function LinearLog(cg: CandyGraph) {
  const viewport = { x: 0, y: 0, width: 384, height: 384 };

  const coords = cg.coordinate.cartesian(
    cg.scale.linear([0, 1], [40, viewport.width - 16]),
    cg.scale.log(10, [1, 100000], [32, viewport.height - 16])
  );

  const xs = [];
  const ys = [];
  for (let x = 0; x <= 1; x += 0.00001) {
    const y = 100000 * x;
    xs.push(x);
    ys.push(y);
  }

  const font = await cg.defaultFont;

  cg.clear([1, 1, 1, 1]);

  const axes = [
    cg.orthoAxis(coords, "x", font, {
      labelSide: 1,
      tickOffset: -3,
      tickLength: 6,
      tickStep: 0.2,
      labelFormatter: (n) => n.toFixed(1),
    }),
    cg.orthoAxis(coords, "y", font, {
      tickLength: 6,
      tickOffset: 3,
      labelAngle: Math.PI * 0.25,
      minorTickCount: 5,
      minorTickLength: 3,
      minorTickOffset: 2,
      labelFormatter: (n) =>
        n >= 1000 ? Math.round(n / 1000).toString() + "K" : n.toString(),
    }),
  ];

  const grid = [
    cg
      .grid(
        axes[0].info.ticks,
        axes[1].info.ticks,
        coords.xscale.domain,
        coords.yscale.domain,
        { color: [0.25, 0.25, 0.25, 1], width: 1 }
      )
      .retain(),
    cg
      .grid(
        [],
        axes[1].info.minorTicks,
        coords.xscale.domain,
        coords.yscale.domain,
        { color: [0.75, 0.75, 0.75, 1] }
      )
      .retain(),
  ];

  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    grid,
    cg.lineStrip(xs, ys, {
      colors: [1, 0.5, 0.0, 1.0],
      widths: 3,
    }),
    axes,
  ]);

  cg.copyTo(viewport, document.getElementById("ex-00400") as HTMLCanvasElement);
}
// skip-doc-stop
