// ### Scatter plot with zoom and pan [(source)](https://github.com/wwwtyro/candygraph/blob/master/docs/examples/src/{{filename}})
// Scroll wheel to zoom, left mouse button to pan:
//
// <canvas id="ex-00360" style="box-shadow: 0px 0px 8px #ccc;" width=384 height=384></canvas>

// skip-doc-start
import CandyGraph, {
  createDefaultFont,
  createCircles,
  createOrthoAxis,
  createLinearScale,
  createCartesianCoordinateSystem,
  createScissor,
} from "../../../src";

export default async function ScatterPlotZoomPan(cg: CandyGraph) {
  // Scale the canvas by the device pixel ratio.
  const dpr = window.devicePixelRatio;
  const canvas = document.getElementById("ex-00360") as HTMLCanvasElement;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.width *= dpr;
  canvas.height *= dpr;

  // Generate some x & y data.
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < 20000; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const r = 1 - Math.exp(-0.5 * Math.random());
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    xs.push(x + 0.5);
    ys.push(y + 0.5);
  }

  // Store this for performance.
  const circles = createCircles(cg, xs, ys, {
    colors: [0, 0.5, 1.0, 1.0],
    radii: 1 * dpr,
    borderWidths: 0 * dpr,
  }).retain();

  // Create a viewport. Units are in pixels.
  const viewport = { x: 0, y: 0, width: 384 * dpr, height: 384 * dpr };

  // Create a coordinate system from two linear scales. Note
  // that we add 32 pixels of padding to the left and bottom
  // of the viewport, and 16 pixels to the top and right.
  const coords = createCartesianCoordinateSystem(
    createLinearScale([0, 1], [32 * dpr, viewport.width - 16 * dpr]),
    createLinearScale([0, 1], [32 * dpr, viewport.height - 16 * dpr])
  );

  const camera = {
    offset: [0, 0] as number[],
    zoom: 1,
    panning: false,
  };

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    // Scale the zoom. This would need to be adapted to width/height if the plot wasn't square.
    if (e.deltaY < 0) {
      camera.zoom *= 0.95;
    } else {
      camera.zoom /= 0.95;
    }
    // Clamp the zoom.
    camera.zoom = Math.min(2.75, Math.max(0.25, camera.zoom));
    // Determine where the mouse was in the coordinate domain (plot space) when
    // the wheel event happened. Note that e.offsetY is inverted from our canvas
    // space.
    const mousePos = coords.toDomain([e.offsetX, canvas.height - e.offsetY]);
    // Update the coordinates with the new scale.
    coords.xscale.domain = [camera.offset[0], camera.offset[0] + camera.zoom];
    coords.yscale.domain = [camera.offset[1], camera.offset[1] + camera.zoom];
    // Calculate the mouse position in the domain after the coordinate update.
    const newMousePos = coords.toDomain([e.offsetX, canvas.height - e.offsetY]);
    // Calculate a vector representing that shift in mouse position.
    const shift = [mousePos[0] - newMousePos[0], mousePos[1] - newMousePos[1]];
    // Update our camera offset by that shift so that the plot doesn't move
    // relative to the mouse.
    camera.offset[0] += shift[0];
    camera.offset[1] += shift[1];
    coords.xscale.domain = [camera.offset[0], camera.offset[0] + camera.zoom];
    coords.yscale.domain = [camera.offset[1], camera.offset[1] + camera.zoom];
    // Render a new frame.
    requestAnimationFrame(render);
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
      camera.panning = true;
    }
  });
  document.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
      camera.panning = false;
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (camera.panning) {
      // Calculate the offset in the coordinate range (canvas/screen space).
      const offset = coords.toRange(camera.offset);
      // Shift it by the mouse motion. Note that e.movementY is inverted from
      // our canvas space.
      offset[0] -= e.movementX;
      offset[1] += e.movementY;
      // Convert it back to the coordinate domain, store it in the camera offset, and
      // update our coordinates.
      camera.offset = coords.toDomain(offset) as number[];
      coords.xscale.domain = [camera.offset[0], camera.offset[0] + camera.zoom];
      coords.yscale.domain = [camera.offset[1], camera.offset[1] + camera.zoom];
      // Render a new frame.
      requestAnimationFrame(render);
    }
  });

  const font = await createDefaultFont(cg);

  function render() {
    // Clear the viewport.
    cg.clear([1, 1, 1, 1]);

    // Render the data as circles and the axes.
    cg.render(coords, viewport, [
      createScissor(cg, 32 * dpr, 32 * dpr, viewport.width - 48 * dpr, viewport.width - 48 * dpr, true, circles),
      createOrthoAxis(cg, coords, "x", font, {
        labelSide: 1,
        tickOffset: -2.5 * dpr,
        tickLength: 6 * dpr,
        tickStep: 0.2,
        tickWidth: 1 * dpr,
        minorTickCount: 4,
        minorTickLength: 6 * dpr,
        minorTickOffset: -2.5 * dpr,
        axisWidth: 1 * dpr,
        labelSize: 12 * dpr,
        labelFormatter: (n) => n.toFixed(1),
      }),
      createOrthoAxis(cg, coords, "y", font, {
        tickOffset: 2.5 * dpr,
        tickLength: 6 * dpr,
        tickStep: 0.2,
        tickWidth: 1 * dpr,
        minorTickCount: 4,
        minorTickLength: 6 * dpr,
        minorTickOffset: 2.5 * dpr,
        axisWidth: 1 * dpr,
        labelSize: 12 * dpr,
        labelFormatter: (n) => n.toFixed(1),
      }),
    ]);

    cg.copyTo(viewport, document.getElementById("ex-00360") as HTMLCanvasElement);
  }

  render();
}
// skip-doc-stop
