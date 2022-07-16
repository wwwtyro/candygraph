// ### Simple mouse interaction [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00800" style="box-shadow: 0px 0px 8px #ccc;" width=1024 height=768></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  Text,
  Grid,
  InterleavedCircles,
  OrthoAxis,
  LinearScale,
  LogScale,
  CartesianCoordinateSystem,
} from "../../../src";

export default async function HealthAndWealth(cg: CandyGraph): Promise<void> {
  // Create a canvas and add it to the page.
  const canvas = document.getElementById("ex-00800") as HTMLCanvasElement;

  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  const nations = await loadNations();

  const viewport = { x: 0, y: 0, width: canvas.width, height: canvas.height };

  const coords = new CartesianCoordinateSystem(
    cg,
    new LogScale(10, [100, 100000], [64 * dpr, viewport.width - 20 * dpr]),
    new LinearScale([10, 90], [48 * dpr, viewport.height - 60 * dpr])
  );

  const screenCoords = new CartesianCoordinateSystem(
    cg,
    new LinearScale([0, canvas.width], [0, canvas.width]),
    new LinearScale([0, canvas.height], [0, canvas.height])
  );

  const font = await createDefaultFont(cg);

  const axes = [
    new OrthoAxis(cg, coords, "x", font, {
      labelSide: 1,
      labelFormatter: (n) => (n < 1000 ? n.toString() : Math.round(n / 1000).toString() + "K"),
      tickLength: 6 * dpr,
      tickOffset: -3 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,

      minorTickCount: 10,
      minorTickLength: 4 * dpr,
      minorTickOffset: -2 * dpr,
      minorTickWidth: 1 * dpr,
    }),
    new OrthoAxis(cg, coords, "y", font, {
      tickStep: 10,
      tickLength: 6 * dpr,
      tickOffset: 3 * dpr,
      tickWidth: 1 * dpr,
      axisWidth: 1 * dpr,
      labelSize: 12 * dpr,
    }),
  ];

  const Labels = [
    new Text(cg, font, "Income", [canvas.width / 2, 8 * dpr], {
      anchor: [0, -1],
      size: 16 * dpr,
    }),
    new Text(cg, font, "Life Expectancy", [8 * dpr, canvas.height / 2], {
      anchor: [0, 1],
      angle: Math.PI / 2,
      size: 16 * dpr,
    }),
    new Text(cg, font, "The Health & Wealth of Nations", [8 * dpr, canvas.height - 8 * dpr], {
      anchor: [-1, 1],
      size: 32 * dpr,
    }),
  ];

  const grid = [
    new Grid(cg, axes[0].computed.ticks, axes[1].computed.ticks, coords.xscale.domain, coords.yscale.domain, {
      width: 1 * dpr,
    }),
    new Grid(cg, axes[0].computed.minorTicks, [], coords.xscale.domain, coords.yscale.domain, { width: 1 * dpr }),
  ];

  const colors = [];
  for (let i = 0; i < nations.data.length; i++) {
    colors.push(Math.random(), Math.random(), Math.random(), 0.5);
  }

  const circles = new InterleavedCircles(cg, [0, 0], { colors, borderWidths: 0 });

  function render(year: number) {
    year = Math.max(nations.bounds.date.min, year);
    year = Math.min(nations.bounds.date.max, year);
    const index = year - nations.bounds.date.min;
    const xys = [];
    const radii = [];
    for (const nation of nations.data) {
      xys.push(nation.income[index], nation.expectancy[index]);
      radii.push(Math.pow(nation.population[index], 0.175) * dpr);
    }
    circles.xys.update(xys);
    circles.radii.update(radii);

    cg.clear([1, 1, 1, 1]);
    cg.render(coords, viewport, [grid, circles, axes]);

    cg.render(screenCoords, viewport, [
      new Text(
        cg,
        font,
        year.toString(),
        [screenCoords.xscale.domain[1] - 32 * dpr, screenCoords.yscale.domain[0] + 32 * dpr],
        {
          anchor: [1, -1],
          size: 128 * dpr,
          color: [0, 0, 0, 0.25],
        }
      ),
      Labels,
    ]);
    cg.copyTo(viewport, canvas);
  }

  render(1900);

  canvas.addEventListener("mousemove", (e) => {
    const dx = e.offsetX / (<HTMLCanvasElement>e.target).clientWidth;
    render(Math.floor(nations.bounds.date.min + dx * (nations.bounds.date.max - nations.bounds.date.min)));
  });
}

async function loadNations() {
  const dataurl =
    "https://gist.githubusercontent.com/wwwtyro/55fd903fbcf7fdb9e151a159109ceae2/raw/f9379be627ceda5db7bc5ea8fa8fa96ef5c3cab3/json";
  const nations = await (await fetch(dataurl)).json();

  const bounds = {
    date: {
      min: Infinity,
      max: -Infinity,
    },
    expectancy: {
      min: Infinity,
      max: -Infinity,
    },
    population: {
      min: Infinity,
      max: -Infinity,
    },
    income: {
      min: Infinity,
      max: -Infinity,
    },
  };

  for (const nation of nations) {
    bounds.date.min = Math.min(
      bounds.date.min,
      nation.income[0][0],
      nation.lifeExpectancy[0][0],
      nation.population[0][0]
    );
    bounds.date.max = Math.max(
      bounds.date.max,
      nation.income[nation.income.length - 1][0],
      nation.lifeExpectancy[nation.lifeExpectancy.length - 1][0],
      nation.population[nation.population.length - 1][0]
    );
  }

  function interpolate(nation: any, item: string, year: number) {
    const obj = nation[item];
    const index = obj.findIndex((inc: [number, number]) => inc[0] >= year);
    if (obj[index[0]] === year) {
      return obj[index][1];
    }
    if (index >= obj.length || index === -1) {
      return obj[obj.length - 1][1];
    }
    if (index === 0) {
      return obj[0][1];
    }
    const right = obj[index];
    const left = obj[index - 1];
    const slope = (right[1] - left[1]) / (right[0] - left[0]);
    return left[1] + slope * (year - left[0]);
  }

  const nationData = [];
  for (const nation of nations) {
    const data = {
      name: nation.name,
      income: [] as number[],
      population: [] as number[],
      expectancy: [] as number[],
    };

    for (let year = bounds.date.min; year <= bounds.date.max; year++) {
      data.income.push(interpolate(nation, "income", year));
      data.population.push(interpolate(nation, "population", year));
      data.expectancy.push(interpolate(nation, "lifeExpectancy", year));
    }

    bounds.income.min = Math.min(bounds.income.min, ...data.income);
    bounds.income.max = Math.max(bounds.income.max, ...data.income);
    bounds.population.min = Math.min(bounds.population.min, ...data.population);
    bounds.population.max = Math.max(bounds.population.max, ...data.population);
    bounds.expectancy.min = Math.min(bounds.expectancy.min, ...data.expectancy);
    bounds.expectancy.max = Math.max(bounds.expectancy.max, ...data.expectancy);

    nationData.push(data);
  }

  return {
    bounds,
    data: nationData,
  };
}
// skip-doc-stop
