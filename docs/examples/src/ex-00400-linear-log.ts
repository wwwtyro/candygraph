// ### Logarithmic Y-Axis [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00400" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  createGrid,
  createLineStrip,
  createOrthoAxis,
  createLinearScale,
  createLogScale,
  createCartesianCoordinateSystem,
} from "../../../src";

export default async function LinearLog(cg: CandyGraph) {
  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-00400") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  const viewport = { x: 0, y: 0, width: 384 * dpr, height: 384 * dpr };

  const coords = createCartesianCoordinateSystem(
    cg,
    createLinearScale([0, 1], [40 * dpr, viewport.width - 16 * dpr]),
    createLogScale(10, [1, 100000], [32 * dpr, viewport.height - 16 * dpr])
  );

  const xs = [];
  const ys = [];
  for (let x = 0; x <= 1; x += 0.00001) {
    const y = 100000 * x;
    xs.push(x);
    ys.push(y);
  }

  const font = await createDefaultFont(cg);

  cg.clear([1, 1, 1, 1]);

  const axes = [
    createOrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      tickOffset: -3 * dpr,
      tickLength: 6 * dpr,
      tickStep: 0.2,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,

      labelFormatter: (n) => n.toFixed(1),
    }),
    createOrthoAxis(cg, coords, "y", font, {
      tickLength: 6 * dpr,
      tickOffset: 3 * dpr,
      labelAngle: Math.PI * 0.25,
      minorTickCount: 5,
      minorTickLength: 3 * dpr,
      minorTickOffset: 2 * dpr,
      minorTickWidth: 1 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,

      labelFormatter: (n) => (n >= 1000 ? Math.round(n / 1000).toString() + "K" : n.toString()),
    }),
  ];

  const grid = [
    createGrid(cg, axes[0].info.ticks, axes[1].info.ticks, coords.xscale.domain, coords.yscale.domain, {
      color: [0.25, 0.25, 0.25, 1],
      width: 1 * dpr,
    }),
    createGrid(cg, [], axes[1].info.minorTicks, coords.xscale.domain, coords.yscale.domain, {
      color: [0.75, 0.75, 0.75, 1],
      width: 1 * dpr,
    }),
  ];

  cg.clear([1, 1, 1, 1]);

  cg.render(coords, viewport, [
    grid,
    createLineStrip(cg, xs, ys, {
      colors: [1, 0.5, 0.0, 1.0],
      widths: 3,
    }),
    axes,
  ]);

  cg.copyTo(viewport, document.getElementById("ex-00400") as HTMLCanvasElement);
}
// skip-doc-stop
