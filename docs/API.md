# CandyGraph API

```typescript
import CandyGraph, {
  // Scales
  LinearScale,
  createLinearScale,
  LogScale,
  createLogScale,

  // Coordinate Systems
  CartesianCoordinateSystem,
  createCartesianCoordinateSystem,
  PolarCoordinateSystem,
  createPolarCoordinateSystem,

  // Primitives
  Circles,
  createCircles,
  Font,
  createFont,
  HLines,
  createHLines,
  InterleavedCircles,
  createInterleavedCircles,
  InterleavedShapes,
  createInterleavedShapes,
  LineSegments,
  createLineSegments,
  LineStrip,
  createLineStrip,
  Rects,
  createRects,
  Shapes,
  createShapes,
  Text,
  createText,
  Triangles,
  createTriangles,
  VLines,
  createVLines,
  Wedges,
  createWedges,
  Axis,
  createAxis,
  Grid,
  createGrid,
  OrthoAxis,
  createOrthoAxis,

  // Other
  Dataset,
  createDataset,
  createDefaultFont,
} from "candygraph";
```

## CandyGraph Class

### Constructor

#### `const cg = new CandyGraph([options?: {}]): CandyGraph`

| Parameter | Type   | Description          |
| --------- | ------ | -------------------- |
| options   | Object | Optional. See below. |

| Option | Type              | Default           | Description                                                                                     |
| ------ | ----------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| canvas | HTMLCanvasElement | HTMLCanvasElement | The canvas element the webgl context will be created from. One will be created if not provided. |
| alpha  | boolean           | false             | Indicates if the canvas contains an alpha buffer.                                               |

### Methods

#### `cg.clear(color: Vector4): void`

Clears the entire CandyGraph canvas.

| Parameter | Type    | Description                                                                                                  |
| --------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| color     | Vector4 | Required. An array of four values - red, green, blue, and alpha. The values should be in the range [0 .. 1]. |

##### Example

```typescript
// Clear the canvas to solid white.
cg.clear([1, 1, 1, 1]);

// Clear the canvas to blue.
cg.clear([0, 0, 1, 1]);
```

#### `cg.render(coords: CoordinateSystem, viewport: Viewport, renderable: Renderable): void`

Renders the given Renderable(s) to the given Viewport with the provided
CoordinateSystem.

| Parameter  | Type             | Description                                                                   |
| ---------- | ---------------- | ----------------------------------------------------------------------------- |
| coords     | CoordinateSystem | Required. The CoordinateSystem with which the Renderable(s) will be rendered. |
| viewport   | Viewport         | Required. The Viewport the Renderable(s) will be rendered to on the canvas.   |
| renderable | Renderable       | Required. A Renderable or array of Renderables.                               |

##### Example

```typescript
// Create a viewport.
const viewport = { x: 0, y: 0, width: 384, height: 384 };

// Create a coordinate system.
const coords = createCartesianCoordinateSystem(
  createLinearScale([0, 1], [32, viewport.width - 16]),
  createLinearScale([0, 1], [32, viewport.height - 16])
);

// Render a line segment to the viewport.
cg.render(coords, viewport, createLineSegments(cg, [0, 0, 1, 1]));

// Render a couple more line segments to the viewport.
cg.render(coords, viewport, [createLineSegments(cg, [0.5, 0, 0.5, 1]), createLineSegments(cg, [0, 1, 1, 0])]);
```

#### `cg.copyTo(sourceViewport: Viewport, destinationCanvas?: HTMLCanvasElement, destinationViewport?: Viewport): HTMLCanvasElement`

Copies the contents of the CandyGraph canvas to another canvas. Returns the `HTMLCanvasElement` that was copied to.

| Parameter           | Type              | Description                                                                                                                         |
| ------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| sourceViewport      | Viewport          | Required. The Viewport of the CandyGraph canvas that will be copied _from_.                                                         |
| destinationCanvas   | HTMLCanvasElement | Optional. The canvas that will be copied to. If not provided, one will be created with the dimensions of `destinationViewport`.     |
| destinationViewport | Viewport          | Optional. If not provided, one will be created that is positioned at `[0, 0]` and with the width and height of the `sourceViewport` |

#### `cg.hasPositionBuffer(name: string): boolean`

This method tests if a specific Regl buffer is cached.

| Parameter | Type   | Description                                           |
| --------- | ------ | ----------------------------------------------------- |
| name      | string | Required. The name of the buffer object to be tested. |

#### `cg.getPositionBuffer(name: string): Buffer`

This method returns a specific cached Regl buffer.

| Parameter | Type   | Description                                     |
| --------- | ------ | ----------------------------------------------- |
| name      | string | Required. The name of the cached buffer object. |

#### `cg.setPositionBuffer(name: string, data: number[] | number[][]): void`

This method instatiates and caches position data as a Regl buffer. Useful for primitives that use instanced arrays.

| Parameter | Type                   | Description                            |
| --------- | ---------------------- | -------------------------------------- |
| name      | string                 | Required. The name of the Regl buffer. |
| data      | number[] or number[][] | Required. The data of the Regl buffer. |

#### `cg.clearPositionBuffers(): void`

This method clears all cached Regl buffers.

#### `cg.destroy(): void`

This method destroys the Regl instance and cached position buffers.

## Factory Functions

#### `createDataset(cg: CandyGraph, data: NumberArray, autoDispose?: boolean): DataSet`

Returns a reusable DataSet. These can be used to make some operations more
efficient, such as rendering the same points many times but in different
positions.

| Parameter   | Type        | Description                                                                                                 |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| cg          | CandyGraph  | Required. The CandyGraph instance for wich you want to create a DataSet.                                    |
| data        | NumberArray | Required. The data to convert to a DataSet. The DataSet will be stored on the GPU for extremely fast reuse. |
| autoDispose | boolean     | Optional. If `true` the DataSet instance will automatically be disposed.                                    |

##### Example

```typescript
// Create a reusable DataSet.
const data = createDataset(cg, [0, 0, 1, 1]);

// Render a line segment to the viewport.
cg.render(coords, viewport, [
  createLineSegment(cg, data, {colors: [1, 0, 0, 1], widths: 4]}), // red, width 4
  createLineSegment(cg, data, {colors: [0, 0, 1, 1], widths: 1]}), // blue, width 1
]);
```

#### `createLineSegments(cg: CandyGraph, points: NumberArray | Dataset, [options: {}]): LineSegments`

Creates a `LineSegments` that draws line segments when rendered.

| Parameter | Type                   | Description                                                                                                                          |
| --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                                                   |
| points    | NumberArray or Dataset | Required. An array of points in the format `[x0, y0, x1, y1, ...]` that represent the endpoints of the line segments to be rendered. |
| options   | Object                 | Optional. See below.                                                                                                                 |

| Option | Type                             | Default      | Description                                                                                                |
| ------ | -------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| widths | number or NumberArray or Dataset | 1            | The width of the line segments. If this parameter is a single number, it will apply to all line segments.  |
| colors | NumberArray or Dataset           | [0, 0, 0, 1] | The color of the line segments. If this parameter is a single Vector4, it will apply to all line segments. |

#### `createLineStrip(cg: CandyGraph, xs: NumberArray or Dataset, ys: NumberArray or Dataset, [options: {}]): LineStrip`

Returns a `LineStrip` that draws a line strip when rendered.

| Parameter | Type                   | Description                                                                                                                   |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                                            |
| xs        | NumberArray or Dataset | Required. An array of points in the format `[x0, x1, ...]` that represent the x-coordinates of the line strip to be rendered. |
| ys        | NumberArray or Dataset | Required. An array of points in the format `[y0, y1, ...]` that represent the y-coordinates of the line strip to be rendered. |
| options   | Object                 | Optional. See below.                                                                                                          |

| Option | Type                             | Default      | Description                                                                                                 |
| ------ | -------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| widths | number or NumberArray or Dataset | 1            | The width of the line strip segments. If this parameter is a single number, it will apply to all segments.  |
| colors | NumberArray or Dataset           | [0, 0, 0, 1] | The color of the line strip segments. If this parameter is a single Vector4, it will apply to all segments. |

#### `createFont(cg: CandyGraph, image: HTMLImageElement, json: {}): Font`

Returns a `Font` object that can be used to render text.

Font image and data files can be generated with `msdf-bmfont`:

```bash
$ npm i -g msdf-bmfont-xml
$ msdf-bmfont -f json -s 24 -t sdf --smart-size Lato-Regular.ttf
```

Note that CandyGraph includes a default font, so generating your own is unnecessary.

| Parameter | Type             | Description                                                                 |
| --------- | ---------------- | --------------------------------------------------------------------------- |
| cg        | CandyGraph       | Required. The CandyGraph instance for wich you want to create a DataSet.    |
| image     | HTMLImageElement | Required. An `Image` object that contains an SDF texture of the font.       |
| json      | Object           | Required. An object that contains information about how to render the font. |

#### `createText(cg: CandyGraph, font: Font, text: string, position: Vector2, [options: {}]): Text`

Returns a `Text` object that draws text when rendered.

| Parameter | Type       | Description                                        |
| --------- | ---------- | -------------------------------------------------- |
| cg        | CandyGraph | Required. The `CandyGraph` instance for rendering. |
| font      | Font       | Required. A `Font` object used to render the text. |
| text      | string     | Required. The text to render.                      |
| position  | Vector2    | Required. The position of the text.                |
| options   | Object     | Optional. See below.                               |

| Option | Type    | Default      | Description                                                                                                                                                            |
| ------ | ------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| align  | number  | 0            | A value between -1 and 1 that represents the alignment of multiple lines of text. -1 is aligned fully to the left, 1 is aligned fully to the right, and 0 is centered. |
| anchor | Vector2 | [0, 0]       | The x/y position of the anchor relative to the text quad, on the range [-1, -1] (bottom left) to [1, 1] (top right).                                                   |
| angle  | number  | 0            | The angle at which the text will be rotated around the anchor.                                                                                                         |
| color  | Vector4 | [0, 0, 0, 1] | The color of the text.                                                                                                                                                 |
| size   | number  | 12           | The size (in pixels) of the text.                                                                                                                                      |

#### `createTriangles(cg: CandyGraph, vertices: NumberArray or Dataset, [options: {}]): Triangles`

Returns a `Triangles` object that draws triangles when rendered.

| Parameter | Type                   | Description                                                                                                            |
| --------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                                     |
| vertices  | NumberArray or Dataset | Required. Set of 2D points in the form [x0, y0, x1, y1, ...] that describe the (unindexed) set of triangles to render. |
| options   | Object                 | Optional. See below.                                                                                                   |

| Option | Type    | Default        | Description                 |
| ------ | ------- | -------------- | --------------------------- |
| color  | Vector4 | [0, 0, 0, 0.5] | The color of the triangles. |

#### `createHLines(cg: CandyGraph, lines: NumberArray or Dataset, [options: {}]): HLines`

Returns an `HLines` object that draws clean horizontal lines when rendered. Line
widths are rounded to the nearest pixel (with a minimum of 1) so that the lines
never appear blurry. This is useful when rendering items like orthographic axes;
without this approach, axis lines or tick marks can consume different numbers of
pixels and result in an inconsistent appearance.

| Parameter | Type                   | Description                                                                                                       |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                                |
| lines     | NumberArray or Dataset | The line positions in the form [x0_0, x0_1, y0, x1_0, x1_1, y1, ...] where each line is defined by three numbers. |
| options   | Object                 | Optional. See below.                                                                                              |

| Option | Type                             | Default      | Description                                                                                |
| ------ | -------------------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| colors | NumberArray or Dataset           | [0, 0, 0, 1] | The color of the lines. If this value is a single Vector4, it will apply to all the lines. |
| widths | number or NumberArray or Dataset | 1            | The width of the lines. If this value is a single number, it will apply to all the lines.  |

#### `createVLines(cg: CandyGraph, lines: NumberArray or Dataset, [options: {}]): VLines`

Returns a `VLines` object that draws clean vertical lines when rendered. Line
widths are rounded to the nearest pixel (with a minimum of 1) so that the lines
never appear blurry. This is useful when rendering items like orthographic axes;
without this approach, axis lines or tick marks can consume different numbers of
pixels and result in an inconsistent appearance.

| Parameter | Type                   | Description                                                                                                                 |
| --------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                                          |
| lines     | NumberArray or Dataset | Required. The line positions in the form [x0, y0_0, y0_1, x1, y1_0, y1_1, ...] where each line is defined by three numbers. |
| options   | Object                 | Optional. See below.                                                                                                        |

| Option | Type                             | Default      | Description                                                                                |
| ------ | -------------------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| colors | NumberArray or Dataset           | [0, 0, 0, 1] | The color of the lines. If this value is a single Vector4, it will apply to all the lines. |
| widths | number or NumberArray or Dataset | 1            | The width of the lines. If this value is a single number, it will apply to all the lines.  |

#### `createCircles(cg: CandyGraph, xs: NumberArray or Dataset, ys: NumberArray or Dataset, [options: {}]): Circles`

Renders colored circles with optional borders.

| Parameter | Type                   | Description                                                                    |
| --------- | ---------------------- | ------------------------------------------------------------------------------ |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                             |
| xs        | NumberArray or Dataset | Required. The x coordinates of the circle centers in the form `[x0, x1, ...]`. |
| ys        | NumberArray or Dataset | Required. The y coordinates of the circle centers in the form `[y0, y1, ...]`. |
| options   | Object                 | Optional. See below.                                                           |

| Option       | Type                             | Default        | Description                                                                                                                 |
| ------------ | -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| colors       | NumberArray or Dataset           | [0, 0, 0, 0.5] | The interior color of the circles. If this value is a single Vector4, it will apply to all the circles.                     |
| radii        | number or NumberArray or Dataset | 10             | The radius of the circles (including border) in pixels. If this value is a single number, it will apply to all the circles. |
| borderColors | NumberArray or Dataset           | [0, 0, 0, 1]   | The color of the borders. If this value is a single Vector4, it will apply to all the circles.                              |
| borderWidths | number or NumberArray or Dataset | 3              | The width of the borders in pixels. If this value is a single number, it will apply to all the borders.                     |

#### `createInterleavedCircles(cg: CandyGraph, xys: NumberArray or Dataset, [options: {}]): Circles`

Renders colored circles with optional borders.

| Parameter | Type                   | Description                                                                                  |
| --------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                           |
| xys       | NumberArray or Dataset | Required. The x and y coordinates of the circle centers in the form `[x0, y0, x1, y1, ...]`. |
| options   | Object                 | Optional. See below.                                                                         |

| Option       | Type                             | Default        | Description                                                                                                                 |
| ------------ | -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| colors       | NumberArray or Dataset           | [0, 0, 0, 0.5] | The interior color of the circles. If this value is a single Vector4, it will apply to all the circles.                     |
| radii        | number or NumberArray or Dataset | 10             | The radius of the circles (including border) in pixels. If this value is a single number, it will apply to all the circles. |
| borderColors | NumberArray or Dataset           | [0, 0, 0, 1]   | The color of the borders. If this value is a single Vector4, it will apply to all the circles.                              |
| borderWidths | number or NumberArray or Dataset | 3              | The width of the borders in pixels. If this value is a single number, it will apply to all the borders.                     |

#### `createRects(cg: CandyGraph, rects: NumberArray or Dataset, [options: {}]): Rects`

Renders colored rectangles.

| Parameter | Type                   | Description                                                                                                                                        |
| --------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                                                                 |
| rects     | NumberArray or Dataset | Required. The x, y position of the lower-left corner of the rectangle and its width and height in the form `[x0, y0, w0, h0, x1, y1, w1, h1, ...]` |
| options   | Object                 | Optional. See below.                                                                                                                               |

| Option | Type                   | Default        | Description                                                                                          |
| ------ | ---------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| colors | NumberArray or Dataset | [0, 0, 0, 0.5] | The color of the rectangles. If this value is a single Vector4, it will apply to all the rectangles. |

#### `createWedges(cg: CandyGraph, xys: NumberArray or Dataset, angles: NumberArray or Dataset, [options: {}]): Wedges`

Renders colored wedges. Useful for pie charts.

| Parameter | Type                   | Description                                                                                                 |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                          |
| xys       | NumberArray or Dataset | Required. The x, y coordinates of the wedge point in the form `[x0, y0, x1, y1, ...]`                       |
| angles    | NumberArray or Dataset | Required. The angle and arclength of each wedge in the form `[angle0, arclength0, angle1, arclength1, ...]` |
| options   | Object                 | Optional. See below.                                                                                        |

| Option | Type                             | Default        | Description                                                                                            |
| ------ | -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| colors | NumberArray or Dataset           | [0, 0, 0, 0.5] | The interior color of the wedges. If this value is a single Vector4, it will apply to all the wedges.  |
| radii  | number or NumberArray or Dataset | 10             | The radius of the wedges in pixels. If this value is a single number, it will apply to all the wedges. |

#### `createInterleavedShapes(cg: CandyGraph, shape: NumberArray or Dataset, xys: NumberArray or Dataset, [options: {}]): Shapes`

Renders colored shapes. Useful for custom trace points.

| Parameter | Type                   | Description                                                                                                                                     |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                                                              |
| shape     | NumberArray or Dataset | Required. Set of 2D points in the form `[x0, y0, x1, y1, ...]` that describe the (unindexed) set of triangles representing the shape to render. |
| xys       | NumberArray or Dataset | Required. The x, y coordinates of the shape positions in the form `[x0, y0, x1, y1, ...]`                                                       |
| options   | Object                 | Optional. See below.                                                                                                                            |

| Option   | Type                   | Default        | Description                                                                                              |
| -------- | ---------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| colors   | NumberArray or Dataset | [0, 0, 0, 0.5] | The color of the shapes. If this value is a single Vector4, it will apply to all the shapes.             |
| scales   | NumberArray or Dataset | [1, 1]         | The scale of the shapes. If this value is a single Vector2, it will apply to all the shapes.             |
| rotation | NumberArray or Dataset | [0]            | The rotation of the shapes in radians. If this value is a single float, it will apply to all the shapes. |

#### `createShapes(cg: CandyGraph, shape: NumberArray or Dataset, xs: NumberArray or Dataset, ys: NumberArray or Dataset, [options: {}]): Shapes`

Renders colored shapes. Useful for custom trace points.

| Parameter | Type                   | Description                                                                                                                                     |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| cg        | CandyGraph             | Required. The `CandyGraph` instance for rendering.                                                                                              |
| shape     | NumberArray or Dataset | Required. Set of 2D points in the form `[x0, y0, x1, y1, ...]` that describe the (unindexed) set of triangles representing the shape to render. |
| xs        | NumberArray or Dataset | Required. The x coordinates of the shape positions in the form `[x0, x1, ...]`                                                                  |
| ys        | NumberArray or Dataset | Required. The y coordinates of the shape positions in the form `[y0, y1, ...]`                                                                  |
| options   | Object                 | Optional. See below.                                                                                                                            |

| Option   | Type                   | Default        | Description                                                                                              |
| -------- | ---------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| colors   | NumberArray or Dataset | [0, 0, 0, 0.5] | The color of the shapes. If this value is a single Vector4, it will apply to all the shapes.             |
| scales   | NumberArray or Dataset | [1, 1]         | The scale of the shapes. If this value is a single Vector2, it will apply to all the shapes.             |
| rotation | NumberArray or Dataset | [0]            | The rotation of the shapes in radians. If this value is a single float, it will apply to all the shapes. |

#### `createAxis(cg: CandyGraph, coords: CoordinateSystem, start: Vector2, end: Vector2, ticks: NumberArray, labels: string[], font: Font, [options: {}]): Axis`

Returns an `Axis` object that draws an axis when rendered.

| Parameter | Type             | Description                                                         |
| --------- | ---------------- | ------------------------------------------------------------------- |
| cg        | CandyGraph       | Required. The `CandyGraph` instance for rendering.                  |
| coords    | CoordinateSystem | Required. The CoordinateSystem for which this axis will be created. |
| start     | Vector2          | Required. One endpoint of the axis.                                 |
| end       | Vector2          | Required. The other endpoint of the axis.                           |
| ticks     | NumberArray      | Required. The position of the ticks as a distance from `start`.     |
| labels    | string[]         | Required. The string labels for the ticks.                          |
| font      | Font             | Required. The `Font` used to render the tick labels.                |
| options   | Object           | Optional. See below.                                                |

| Option          | Type        | Default   | Description                                                                                                                                                                                                    |
| --------------- | ----------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| axisColor       | Vector4     | [0,0,0,1] | The color of the primary axis line.                                                                                                                                                                            |
| axisWidth       | number      | 1         | The width of the primary axis line.                                                                                                                                                                            |
| labelAnchor     | Vector2     | undefined | The x/y position of the anchor relative to the text quad, on the range [-1, -1] (bottom left) to [1, 1] (top right). When undefined will automatically anchor the text according to the direction of the axis. |
| labelAngle      | number      | 0         | The angle at which the text will be rotated around the anchor.                                                                                                                                                 |
| labelColor      | Vector4     | [0,0,0,1] | The color of the tick labels.                                                                                                                                                                                  |
| labelPad        | number      | 3         | The padding between the ticks and tick labels in pixels.                                                                                                                                                       |
| labelSide       | 1 or -1     | -1        | Which side of the axis the label will be placed on.                                                                                                                                                            |
| labelSize       | number      | 12        | The size in pixels of the label font.                                                                                                                                                                          |
| tickColor       | Vector4     | [0,0,0,1] | The color of the ticks.                                                                                                                                                                                        |
| tickLength      | number      | 12        | The length of the ticks.                                                                                                                                                                                       |
| tickOffset      | number      | 0         | How far the ticks are shifted from centered on the primary axis line. Zero is centered, can be negative or positive.                                                                                           |
| tickWidth       | number      | 1         | The width of the ticks.                                                                                                                                                                                        |
| minorTicks      | NumberArray | []        | The position of the minor ticks as a distance from `start`.                                                                                                                                                    |
| minorTickColor  | Vector4     | [0,0,0,1] | The color of the minor ticks.                                                                                                                                                                                  |
| minorTickLength | number      | 6         | The length of the minor ticks.                                                                                                                                                                                 |
| minorTickOffset | number      | 0         | How far the minor ticks are shifted from centered on the primary axis line. Zero is centered, can be negative or positive.                                                                                     |
| minorTickWidth  | number      | 1         | The width of the minor ticks.                                                                                                                                                                                  |

#### `createOrthoAxis(cg: CandyGraph, coords: CoordinateSystem, axis: "x" | "y", font: Font, [options: {}]): OrthoAxis`

Returns an `OrthoAxis` object that draws an orthographic (x or y) axis when rendered.

| Parameter | Type             | Description                                                         |
| --------- | ---------------- | ------------------------------------------------------------------- |
| cg        | CandyGraph       | Required. The `CandyGraph` instance for rendering.                  |
| coords    | CoordinateSystem | Required. The CoordinateSystem for which this axis will be created. |
| axis      | "x" or "y"       | Required. Selects the x or y axis.                                  |
| font      | Font             | Required. The `Font` used to render the tick labels.                |
| options   | Object           | Optional. See below.                                                |

| Option          | Type                  | Default                     | Description                                                                                                                                                                                                    |
| --------------- | --------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| axisHigh        | number                | undefined                   | The maximum value encompassed by this axis.                                                                                                                                                                    |
| axisIntercept   | number                | undefined                   | The position on the opposing axis that this axis intercepts.                                                                                                                                                   |
| axisLow         | number                | undefined                   | The minimum value encompassed by this axis.                                                                                                                                                                    |
| labelFormatter  | (n: number) => string | (n: number) => n.toString() | The function to use to format the ticks.                                                                                                                                                                       |
| minorTickCount  | number                | undefined                   | The number of minor ticks between major ticks. None if undefined.                                                                                                                                              |
| tickOrigin      | number                | 0                           | Used to anchor ticks to the axis. Using a value of 0.1 and a tickStep of 1.0 will result in ticks at [... -1.9, -0.9, 0.1, 1.1 ... ].                                                                          |
| tickStep        | number                | 1                           | The distance between ticks.                                                                                                                                                                                    |
| axisColor       | Vector4               | [0,0,0,1]                   | The color of the primary axis line.                                                                                                                                                                            |
| axisWidth       | number                | 1                           | The width of the primary axis line.                                                                                                                                                                            |
| labelAnchor     | Vector2               | undefined                   | The x/y position of the anchor relative to the text quad, on the range [-1, -1] (bottom left) to [1, 1] (top right). When undefined will automatically anchor the text according to the direction of the axis. |
| labelAngle      | number                | 0                           | The angle at which the text will be rotated around the anchor.                                                                                                                                                 |
| labelColor      | Vector4               | [0,0,0,1]                   | The color of the tick labels.                                                                                                                                                                                  |
| labelPad        | number                | 3                           | The padding between the ticks and tick labels in pixels.                                                                                                                                                       |
| labelSide       | 1 or -1               | -1                          | Which side of the axis the label will be placed on.                                                                                                                                                            |
| labelSize       | number                | 12                          | The size in pixels of the label font.                                                                                                                                                                          |
| tickColor       | Vector4               | [0,0,0,1]                   | The color of the ticks.                                                                                                                                                                                        |
| tickLength      | number                | 12                          | The length of the ticks.                                                                                                                                                                                       |
| tickOffset      | number                | 0                           | How far the ticks are shifted from centered on the primary axis line. Zero is centered, can be negative or positive.                                                                                           |
| tickWidth       | number                | 1                           | The width of the ticks.                                                                                                                                                                                        |
| minorTicks      | NumberArray           | []                          | The position of the minor ticks as a distance from `start`.                                                                                                                                                    |
| minorTickColor  | Vector4               | [0,0,0,1]                   | The color of the minor ticks.                                                                                                                                                                                  |
| minorTickLength | number                | 6                           | The length of the minor ticks.                                                                                                                                                                                 |
| minorTickOffset | number                | 0                           | How far the minor ticks are shifted from centered on the primary axis line. Zero is centered, can be negative or positive.                                                                                     |
| minorTickWidth  | number                | 1                           | The width of the minor ticks.                                                                                                                                                                                  |

#### `createGrid(cg: CandyGraph, xPositions: NumberArray, yPositions: NumberArray, xExtents: Vector2, yExtents: Vector2, [options: {}]): Grid`

Will render a grid of `HLines` and `VLines`.

| Parameter  | Type        | Description                                                                                      |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------ |
| cg         | CandyGraph  | Required. The `CandyGraph` instance for rendering.                                               |
| xPositions | NumberArray | Required. The x-coordinates of all the vertical lines of the grid in the format [x0, x1, ...].   |
| yPositions | NumberArray | Required. The y-coordinates of all the horizontal lines of the grid in the format [y0, y1, ...]. |
| xExtents   | Vector2     | Required. The start and end points of all the horizontal lines of the grid.                      |
| yExtents   | Vector2     | Required. The start and end points of all the vertical lines of the grid.                        |
| options    | Object      | Optional. See below.                                                                             |

| Option | Type    | Default            | Description                  |
| ------ | ------- | ------------------ | ---------------------------- |
| color  | Vector4 | [0.75,0.75,0.75,1] | The color of the grid lines. |
| width  | number  | 1                  | The width of the grid lines. |

#### `createScissor(cg: CandyGraph, x: number, y: number, width: number, height: number, screenSpace: boolean, children: Renderable): Scissor`

Returns a `Scissor` object. All children will be clipped to the provided bounds.

| Parameter   | Type       | Description                                                                  |
| ----------- | ---------- | ---------------------------------------------------------------------------- |
| cg          | CandyGraph | Required. The `CandyGraph` instance for rendering.                           |
| x           | number     | Required. The x-coordinates of the bottom-left corner of the scissor region. |
| y           | number     | Required. The y-coordinates of the bottom-left corner of the scissor region. |
| width       | number     | Required. The width of the scissor region.                                   |
| height      | number     | Required. The height of the scissor region.                                  |
| screenSpace | boolean    | Required. Whether or not the scissor region is defined in screen space.      |
| children    | Renderable | Required. One or more objects to be rendered with the scissor.               |

##### Examples

```typescript
// Not in screen space, with an array of renderables.
createScissor(cg, 0, 0, 1, 1, false, [
  createLineStrip(cg, xs, ys, {
    colors: [1, 0.5, 0, 1],
    widths: 3 * dpr,
  }),
  createCircles(cg, xs, ys, {
    colors: [1, 0.5, 0, 1],
    radii: 6.0 * dpr,
    borderWidths: 0 * dpr,
  }),
  createCircles(cg, xs, ys, {
    colors: [0, 0, 0.25, 1],
    radii: 3.0 * dpr,
    borderWidths: 0 * dpr,
  }),
]),
```

```typescript
// In screen space, with a single renderable (not an array).
createScissor(cg, 32 * dpr, 32 * dpr, viewport.width - 48 * dpr, viewport.width - 48 * dpr, true,
  createLineStrip(cg, xs, ys, {
      colors: [1, 0.5, 0, 1],
      widths: 3 * dpr,
    }),
),
```

#### `createLinearScale(domain: Vector2, range: Vector2): LinearScale`

Returns a `LinearScale` object.

| Parameter | Type    | Description               |
| --------- | ------- | ------------------------- |
| domain    | Vector2 | The domain of this scale. |
| range     | Vector2 | The range of this scale.  |

#### `createLogScale(base: number, domain: Vector2, range: Vector2): LogScale`

Returns a `LogScale` object.

| Parameter | Type    | Description                 |
| --------- | ------- | --------------------------- |
| base      | number  | The base of this log scale. |
| domain    | Vector2 | The domain of this scale.   |
| range     | Vector2 | The range of this scale.    |

#### `createCartesianCoordinateSystem(xscale: Scale, yscale: Scale): CartesianCoordinateSystem`

Returns a `CartesianCoordinateSystem`.

| Parameter | Type  | Description               |
| --------- | ----- | ------------------------- |
| xscale    | Scale | The scale for the x-axis. |
| yscale    | Scale | The scale for the y-axis. |

#### `createPolarCoordinateSystem(xscale: Scale, yscale: Scale): PolarCoordinateSystem`

Returns a `PolarCoordinateSystem`.

| Parameter    | Type  | Description                                           |
| ------------ | ----- | ----------------------------------------------------- |
| radialScale  | Scale | The scale for the radial axis (distance from origin). |
| angularScale | Scale | The scale for the angular axis.                       |
| xScale       | Scale | The scale for the x-axis.                             |
| yScale       | Scale | The scale for the y-axis.                             |

### Properties

- `regl`: The `Regl` context backing this `CandyGraph` object.
- `canvas`: The `HTMLCanvasElement` rendered to by this `CandyGraph` object.
- `defaultFont`: A `Promise<Font>` that resolves to the default `Font` object.
