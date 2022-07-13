// ### Multiple viewports [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00700" style="box-shadow: 0px 0px 8px #ccc;" width=1024 height=512></canvas>

// skip-doc-start
import CandyGraph, {
  Dataset,
  createDefaultFont,
  LineStrip,
  OrthoAxis,
  LinearScale,
  CartesianCoordinateSystem,
} from "../../../src";

export default async function MultiViewport(cg: CandyGraph) {
  const canvas = document.getElementById("ex-00700") as HTMLCanvasElement;

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  const coordstop = new CartesianCoordinateSystem(
    cg,
    new LinearScale([0, 10], [40 * dpr, 256 * dpr - 16 * dpr]),
    new LinearScale([0, 10], [16 * dpr, 256 * dpr - 40 * dpr])
  );

  const coordsbottom = new CartesianCoordinateSystem(
    cg,
    new LinearScale([0, 10], [40 * dpr, 256 * dpr - 16 * dpr]),
    new LinearScale([0, 10], [40 * dpr, 256 * dpr - 16 * dpr])
  );

  const font = await createDefaultFont(cg);

  const miniaxestop = [
    new OrthoAxis(cg, coordstop, "x", font, {
      axisIntercept: 10.5,
      tickStep: 2,
      tickLength: 5 * dpr,
      tickOffset: 2.5 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    new OrthoAxis(cg, coordstop, "y", font, {
      axisIntercept: -0.5,
      tickStep: 2,
      tickLength: 5 * dpr,
      tickOffset: 2 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
  ];

  const miniaxesbottom = [
    new OrthoAxis(cg, coordsbottom, "x", font, {
      axisIntercept: -0.5,
      tickStep: 2,
      tickLength: 5 * dpr,
      tickOffset: -2 * dpr,
      labelSide: 1,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    new OrthoAxis(cg, coordsbottom, "y", font, {
      axisIntercept: -0.5,
      tickStep: 2,
      tickLength: 5 * dpr,
      tickOffset: 2 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
  ];

  function primenoise(t: number) {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19];
    let sum = 0;
    for (const p of primes) {
      sum += Math.sin(t / p);
    }
    return sum / primes.length;
  }

  const xData = [];
  for (let x = 0; x < 10; x += 0.01) {
    xData.push(x);
  }
  const xs = new Dataset(cg, xData);

  function randomTraces() {
    const ys = [];
    const offset = Math.random() * 1000;
    const rate = Math.random() * 10 + 1;
    for (let x = 0; x <= 10; x += 0.01) {
      const y = 5 + 5 * primenoise(x * rate + offset);
      ys.push(y);
    }
    return new LineStrip(cg, xs, ys, {
      colors: [Math.random(), Math.random(), Math.random(), 1],
      widths: dpr * (Math.random() * 2 + 1),
    });
  }

  cg.clear([1, 1, 1, 1]);

  cg.render(coordsbottom, { x: 0, y: 0, width: 256 * dpr, height: 256 * dpr }, [randomTraces(), miniaxesbottom]);
  cg.render(coordsbottom, { x: 256 * dpr, y: 0, width: 256 * dpr, height: 256 * dpr }, [
    randomTraces(),
    randomTraces(),
    miniaxesbottom,
  ]);
  cg.render(coordstop, { x: 0, y: 256 * dpr, width: 256 * dpr, height: 256 * dpr }, [
    randomTraces(),
    randomTraces(),
    randomTraces(),
    miniaxestop,
  ]);
  cg.render(coordstop, { x: 256 * dpr, y: 256 * dpr, width: 256 * dpr, height: 256 * dpr }, [
    randomTraces(),
    randomTraces(),
    randomTraces(),
    randomTraces(),
    miniaxestop,
  ]);

  const coordsbig = new CartesianCoordinateSystem(
    cg,
    new LinearScale([0, 10], [40 * dpr, 512 * dpr - 40 * dpr]),
    new LinearScale([0, 10], [32 * dpr, 512 * dpr - 32 * dpr])
  );

  cg.render(coordsbig, { x: 512 * dpr, y: 0, width: 512 * dpr, height: 512 * dpr }, [
    new OrthoAxis(cg, coordsbig, "x", font, {
      axisIntercept: 0,
      tickStep: 2,
      tickLength: 5 * dpr,
      tickOffset: -2 * dpr,
      labelSide: 1,
      minorTickCount: 4,
      minorTickOffset: 2 * dpr,
      minorTickLength: 4 * dpr,
      minorTickWidth: 1 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    new OrthoAxis(cg, coordsbig, "y", font, {
      axisIntercept: 0,
      tickStep: 0.5,
      tickLength: 5 * dpr,
      tickOffset: 2 * dpr,
      labelFormatter: (l) => l.toFixed(2),
      labelAngle: Math.PI * 0.125,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    new OrthoAxis(cg, coordsbig, "x", font, {
      axisIntercept: 10,
      tickStep: 1,
      tickLength: 5 * dpr,
      tickOffset: 2.5 * dpr,
      labelSide: -1,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    new OrthoAxis(cg, coordsbig, "y", font, {
      axisIntercept: 10,
      tickStep: 0.5,
      tickLength: 5 * dpr,
      tickOffset: 2 * dpr,
      labelSide: 1,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
    randomTraces(),
    randomTraces(),
    randomTraces(),
    randomTraces(),
    randomTraces(),
    randomTraces(),
  ]);

  cg.copyTo({ x: 0, y: 0, width: 1024 * dpr, height: 512 * dpr }, canvas);

  miniaxesbottom[0].dispose();
  miniaxesbottom[1].dispose();
  miniaxestop[0].dispose();
  miniaxestop[1].dispose();
  xs.dispose();
}
// skip-doc-stop
