import { CandyGraph } from "../../..";

export default async function HealthAndWealth(cg: CandyGraph): Promise<void> {
  // Create a canvas and add it to the page.
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  document.body.appendChild(canvas);

  const nations = await loadNations();

  const viewport = { x: 0, y: 0, width: canvas.width, height: canvas.height };

  const coords = cg.coordinate.cartesian(
    cg.scale.log(10, [100, 100000], [64, viewport.width - 20]),
    cg.scale.linear([10, 90], [48, viewport.height - 60])
  );

  const screenCoords = cg.coordinate.cartesian(
    cg.scale.linear([0, canvas.width], [0, canvas.width]),
    cg.scale.linear([0, canvas.height], [0, canvas.height])
  );

  const font = await cg.defaultFont;

  const axes = [
    cg
      .orthoAxis(coords, "x", font, {
        labelSide: 1,
        labelFormatter: (n) =>
          n < 1000 ? n.toString() : Math.round(n / 1000).toString() + "K",
        tickLength: 6,
        tickOffset: -3,
        minorTickCount: 10,
        minorTickLength: 4,
        minorTickOffset: -2,
      })
      .retain(),
    cg
      .orthoAxis(coords, "y", font, {
        tickStep: 10,
        tickLength: 6,
        tickOffset: 3,
      })
      .retain(),
  ];

  const Labels = [
    cg
      .text(font, "Income", [canvas.width / 2, 8], {
        anchor: [0, -1],
        size: 16,
      })
      .retain(),
    cg
      .text(font, "Life Expectancy", [8, canvas.height / 2], {
        anchor: [0, 1],
        angle: Math.PI / 2,
        size: 16,
      })
      .retain(),
    cg
      .text(font, "The Health & Wealth of Nations", [8, canvas.height - 8], {
        anchor: [-1, 1],
        size: 32,
      })
      .retain(),
  ];

  const grid = [
    cg
      .grid(
        axes[0].info.ticks,
        axes[1].info.ticks,
        coords.xscale.domain,
        coords.yscale.domain
      )
      .retain(),
    cg
      .grid(
        axes[0].info.minorTicks,
        [],
        coords.xscale.domain,
        coords.yscale.domain
      )
      .retain(),
  ];

  const colors = [];
  for (let i = 0; i < nations.data.length; i++) {
    colors.push(Math.random(), Math.random(), Math.random(), 0.5);
  }

  const circles = cg.circles([0, 0], { colors, borderWidths: 0 }).retain();

  function render(year: number) {
    year = Math.max(nations.bounds.date.min, year);
    year = Math.min(nations.bounds.date.max, year);
    const index = year - nations.bounds.date.min;
    const positions = [];
    const radii = [];
    for (const nation of nations.data) {
      positions.push(nation.income[index], nation.expectancy[index]);
      radii.push(Math.pow(nation.population[index], 0.175));
    }
    circles.positions.update(positions);
    circles.radii.update(radii);

    cg.clear([1, 1, 1, 1]);
    cg.render(coords, viewport, [grid, circles, axes]);

    cg.render(screenCoords, viewport, [
      cg.text(
        font,
        year.toString(),
        [
          screenCoords.xscale.domain[1] - 32,
          screenCoords.yscale.domain[0] + 32,
        ],
        {
          anchor: [1, -1],
          size: 128,
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
    render(
      Math.floor(
        nations.bounds.date.min +
          dx * (nations.bounds.date.max - nations.bounds.date.min)
      )
    );
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
