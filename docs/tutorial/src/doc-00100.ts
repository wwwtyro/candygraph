// skip-doc-start
import CandyGraph, {
  createLinearScale,
  createCartesianCoordinateSystem,
  createLineStrip,
} from "../../../src";
// skip-doc-stop

// ## Viewport, Scale, and Coordinates

// Let's dive into CandyGraph with a line plot example. We'll start by simply
// rendering the line without any extra "chrome" like axes. Before we create our
// data and render it, though, we'll need to set the stage. First up, our viewport.

// skip-doc-next
export default function doc_00100(cg: CandyGraph): void {
  // Viewports define the region of the canvas we're going to be rendering to.
  // They provide an x- and y-offset, measured in pixels from the bottom left of
  // the canvas, and a width and a height, also in pixels. Behind the scenes
  // we've added a canvas that is 512 pixels in width and 384 pixels in height
  // to this page, so we'll define our viewport like this:
  const viewport = { x: 0, y: 0, width: 512, height: 384 };

  // Scales in CandyGraph are very similar in concept to scales in D3 - they map
  // a value from a _domain_ (usually the space your data exists in) to a
  // _range_ (usually pixels on the screen). CandyGraph adds the capability of
  // utilizing the scale in both javascript/typescript _and_ on the GPU in GLSL.
  // We're going to render a simple sine wave, so the domain for our x-scale
  // will be from 0 to 2π, and for our y-scale from -1 to 1. At first we'll map these
  // to the full width and height of our viewport. Here they are:
  const xscale = createLinearScale([0, 2 * Math.PI], [0, viewport.width]);
  const yscale = createLinearScale([-1, 1], [0, viewport.height]);

  // Now that we have our scales, we can create a coordinate system. Coordinate
  // systems in CandyGraph wrap scales and add a little more GLSL glue code for
  // use on the GPU. Here we'll create a cartesian coordinate system:
  const coords = createCartesianCoordinateSystem(xscale, yscale);

  // Next we're going to make some data for our plot. We'll loop through 0 to 2π
  // with a small increment for our x-values, and calculate the sine of each of
  // those to determine our y-values:
  const xs = [];
  const ys = [];
  for (let x = 0; x <= 2 * Math.PI; x += 0.01) {
    xs.push(x);
    ys.push(Math.sin(x));
  }

  // Next we'll clear the canvas. Note that this function clears the _entire_
  // canvas - it is not influenced by the viewport we just defined.
  cg.clear([1, 1, 1, 1]);

  // Now we can use the coordinate system, viewport, and line data we defined to
  // render a line strip. We'll render it with width 2 pixels and in red
  // (`colors` format is [red, green, blue, alpha]).
  cg.render(coords, viewport, [
    createLineStrip(cg, xs, ys, {
      colors: [1, 0, 0, 1],
      widths: 2,
    }),
  ]);

  // Our CandyGraph context `cg` has a canvas associated with it, but it hasn't
  // been added to the DOM. Instead of doing that, we'll use the `copyTo`
  // utility function to copy it to the canvas we mentioned earlier, which has
  // `id="doc_00100"` defined:
  cg.copyTo(
    viewport,
    document.getElementById("doc_00100") as HTMLCanvasElement
  );
} // skip-doc

// <div style="text-align: center">
//   <canvas id="doc_00100" style="box-shadow: 0px 0px 8px #ccc;" width=512 height=384>
//   </canvas>
// </div>
