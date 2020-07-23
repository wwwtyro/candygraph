// ### Multiple vieports [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00700" style="box-shadow: 0px 0px 8px #ccc;" width=1024 height=512></canvas>

// skip-doc-start
import { CandyGraph } from "../../..";

export default async function MultiViewport(cg: CandyGraph) {
  const canvas = document.getElementById("ex-00700") as HTMLCanvasElement;

  const coordstop = cg.coordinate.cartesian(
    cg.scale.linear([0, 10], [40, 256 - 16]),
    cg.scale.linear([0, 10], [16, 256 - 40])
  );

  const coordsbottom = cg.coordinate.cartesian(
    cg.scale.linear([0, 10], [40, 256 - 16]),
    cg.scale.linear([0, 10], [40, 256 - 16])
  );

  const font = await cg.defaultFont;

  const miniaxestop = [
    cg
      .orthoAxis(coordstop, "x", font, {
        axisIntercept: 10.5,
        tickStep: 2,
        tickLength: 5,
        tickOffset: 2.5,
      })
      .retain(),
    cg
      .orthoAxis(coordstop, "y", font, {
        axisIntercept: -0.5,
        tickStep: 2,
        tickLength: 5,
        tickOffset: 2,
      })
      .retain(),
  ];

  const miniaxesbottom = [
    cg
      .orthoAxis(coordsbottom, "x", font, {
        axisIntercept: -0.5,
        tickStep: 2,
        tickLength: 5,
        tickOffset: -2,
        labelSide: 1,
      })
      .retain(),
    cg
      .orthoAxis(coordsbottom, "y", font, {
        axisIntercept: -0.5,
        tickStep: 2,
        tickLength: 5,
        tickOffset: 2,
      })
      .retain(),
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
  const xs = cg.reusableData(xData);

  function randomTraces() {
    const ys = [];
    const offset = Math.random() * 1000;
    const rate = Math.random() * 10 + 1;
    for (let x = 0; x <= 10; x += 0.01) {
      const y = 5 + 5 * primenoise(x * rate + offset);
      ys.push(y);
    }
    return cg.lineStrip(xs, ys, {
      colors: [Math.random(), Math.random(), Math.random(), 1],
      widths: Math.random() * 2 + 1,
    });
  }

  cg.clear([1, 1, 1, 1]);

  cg.render(coordsbottom, { x: 0, y: 0, width: 256, height: 256 }, [
    randomTraces(),
    miniaxesbottom,
  ]);
  cg.render(coordsbottom, { x: 256, y: 0, width: 256, height: 256 }, [
    randomTraces(),
    randomTraces(),
    miniaxesbottom,
  ]);
  cg.render(coordstop, { x: 0, y: 256, width: 256, height: 256 }, [
    randomTraces(),
    randomTraces(),
    randomTraces(),
    miniaxestop,
  ]);
  cg.render(coordstop, { x: 256, y: 256, width: 256, height: 256 }, [
    randomTraces(),
    randomTraces(),
    randomTraces(),
    randomTraces(),
    miniaxestop,
  ]);

  const coordsbig = cg.coordinate.cartesian(
    cg.scale.linear([0, 10], [40, 512 - 40]),
    cg.scale.linear([0, 10], [32, 512 - 32])
  );

  cg.render(coordsbig, { x: 512, y: 0, width: 512, height: 512 }, [
    cg.orthoAxis(coordsbig, "x", font, {
      axisIntercept: 0,
      tickStep: 2,
      tickLength: 5,
      tickOffset: -2,
      labelSide: 1,
      minorTickCount: 4,
      minorTickOffset: 2,
      minorTickLength: 4,
    }),
    cg.orthoAxis(coordsbig, "y", font, {
      axisIntercept: 0,
      tickStep: 0.5,
      tickLength: 5,
      tickOffset: 2,
      labelFormatter: (l) => l.toFixed(2),
      labelAngle: Math.PI * 0.125,
    }),
    cg.orthoAxis(coordsbig, "x", font, {
      axisIntercept: 10,
      tickStep: 1,
      tickLength: 5,
      tickOffset: 2.5,
      labelSide: -1,
    }),
    cg.orthoAxis(coordsbig, "y", font, {
      axisIntercept: 10,
      tickStep: 0.5,
      tickLength: 5,
      tickOffset: 2,
      labelSide: 1,
    }),
    randomTraces(),
    randomTraces(),
    randomTraces(),
    randomTraces(),
    randomTraces(),
    randomTraces(),
  ]);

  cg.copyTo({ x: 0, y: 0, width: 1024, height: 512 }, canvas);

  miniaxesbottom[0].dispose();
  miniaxesbottom[1].dispose();
  miniaxestop[0].dispose();
  miniaxestop[1].dispose();
  xs.dispose();
}
// skip-doc-stop
