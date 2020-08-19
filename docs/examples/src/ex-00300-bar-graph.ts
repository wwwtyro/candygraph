// ### Bar graph [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// <canvas id="ex-00300" style="box-shadow: 0px 0px 8px #888;" width=512 height=1024></canvas>

// skip-doc-start
import { CandyGraph } from "../../../lib";

export default async function BarGraph(cg: CandyGraph) {
  // Population data.
  const pops: { [k: string]: number } = {
    California: 39512223,
    Texas: 28995881,
    Florida: 21477737,
    "New York": 19453561,
    Pennsylvania: 12801989,
    Illinois: 12671821,
    Ohio: 11689100,
    Georgia: 10617423,
    "North Carolina": 10488084,
    Michigan: 9986857,
    "New Jersey": 8882190,
    Virginia: 8535519,
    Washington: 7614893,
    Arizona: 7278717,
    Massachusetts: 6892503,
    Tennessee: 6829174,
    Indiana: 6732219,
    Missouri: 6137428,
    Maryland: 6045680,
    Wisconsin: 5822434,
    Colorado: 5758736,
    Minnesota: 5639632,
    "South Carolina": 5148714,
    Alabama: 4903185,
    Louisiana: 4648794,
    Kentucky: 4467673,
    Oregon: 4217737,
    Oklahoma: 3956971,
    Connecticut: 3565287,
    Utah: 3205958,
    "Puerto Rico": 3193694,
    Iowa: 3155070,
    Nevada: 3080156,
    Arkansas: 3017804,
    Mississippi: 2976149,
    Kansas: 2913314,
    "New Mexico": 2096829,
    Nebraska: 1934408,
    "West Virginia": 1792147,
    Idaho: 1787065,
    Hawaii: 1415872,
    "New Hampshire": 1359711,
    Maine: 1344212,
    Montana: 1068778,
    "Rhode Island": 1059361,
    Delaware: 973764,
    "South Dakota": 884659,
    "North Dakota": 762062,
    Alaska: 731545,
    "District of Columbia": 705749,
    Vermont: 623989,
    Wyoming: 578759,
    Guam: 168485,
    "U.S. Virgin Islands": 106235,
    "Northern Mariana Islands": 51433,
    "American Samoa": 49437,
  };

  const keys = Object.keys(pops).reverse();

  const viewport = { x: 0, y: 0, width: 512, height: 1024 };

  const coords = cg.coordinate.cartesian(
    cg.scale.linear([0, 40000000], [160, viewport.width - 24]),
    cg.scale.linear([-0.75, keys.length - 1], [32, viewport.height - 48])
  );

  const font = await cg.defaultFont;

  cg.clear([0, 0, 0.25, 1]);

  cg.render(coords, viewport, [
    cg.rects(
      keys.flatMap((key, index): number[] => {
        return [0, index - 0.25, pops[key], 0.5];
      }),
      {
        colors: keys.flatMap((_, i) =>
          i % 2 === 0 ? [1, 0.5, 0, 1] : [0, 0.5, 1, 1]
        ),
      }
    ),
    cg.orthoAxis(coords, "x", font, {
      axisColor: [1, 1, 1, 1],
      labelColor: [1, 1, 1, 1],
      labelSide: 1,
      tickColor: [1, 1, 1, 1],
      tickOffset: -2.5,
      tickLength: 6,
      tickStep: 10000000,
      labelFormatter: (n) => (n > 0 ? `${n / 1000000}M` : "0"),
    }),
    cg.orthoAxis(coords, "x", font, {
      axisIntercept: keys.length - 0.25,
      axisColor: [1, 1, 1, 1],
      labelColor: [1, 1, 1, 1],
      tickColor: [1, 1, 1, 1],
      tickOffset: 3,
      tickLength: 6,
      tickStep: 10000000,
      labelFormatter: (n) => (n > 0 ? `${n / 1000000}M` : "0"),
    }),
    cg.orthoAxis(coords, "y", font, {
      axisHigh: keys.length - 0.25,
      axisColor: [1, 1, 1, 1],
      labelColor: [1, 1, 1, 1],
      tickLength: 0,
      labelFormatter: (n) => keys[n] || "",
    }),
  ]);

  cg.copyTo(viewport, document.getElementById("ex-00300") as HTMLCanvasElement);
}
// skip-doc-stop
