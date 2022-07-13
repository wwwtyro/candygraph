import REGL, { DrawCommand, Regl, Vec4 } from "regl";
import { CoordinateSystem } from "./coordinates/coordinate-system";
import { Viewport, Renderable, RenderableType, Primitive } from "./common";

type Props = {
  resolution: [number, number];
  viewport: Viewport;
};

const commonGLSL = `
  uniform vec2 resolution;

  vec4 rangeToClip(vec2 v) {
    return vec4(2.0 * v / resolution - 1.0, 0.0, 1.0);
  }

  vec4 domainToClip(vec2 v) {
    return rangeToClip(toRange(v));
  }
`;

export interface CandyGraphOptions {
  /** The canvas element the webgl context will be created from. One will be created if not provided. */
  canvas?: HTMLCanvasElement;

  /** Indicates if the canvas contains an alpha buffer. Enable this if you would like to composite your graph with DOM elements. */
  alpha?: boolean;
}

const DEFAULT_OPTIONS = {
  canvas: null,
  alpha: false,
};

export class CandyGraph {
  /** @internal */
  public readonly regl: Regl;

  public readonly canvas: HTMLCanvasElement;

  private commandCache = new Map<string, Map<Function, DrawCommand>>();
  private scope: DrawCommand;

  constructor(options: CandyGraphOptions = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.canvas = opts.canvas ?? document.createElement("canvas");
    this.regl = REGL({
      canvas: this.canvas,
      extensions: ["angle_instanced_arrays", "oes_standard_derivatives"],
      attributes: {
        depth: false,
        alpha: opts.alpha,
        premultipliedAlpha: true,
      },
    });
    this.scope = this.regl({
      uniforms: {
        resolution: this.regl.prop<Props, "resolution">("resolution"),
      },
      viewport: this.regl.prop<Props, "viewport">("viewport"),
      blend: {
        enable: true,
        func: { srcRGB: "src alpha", dstRGB: "one minus src alpha", srcAlpha: "one", dstAlpha: "one minus src alpha" },
      },
      depth: {
        enable: false,
      },
    });
  }

  /** Clears the entire CandyGraph canvas.
   * @examples
   * Clear the canvas to solid white.
   * ```ts
   * cg.clear([1, 1, 1, 1]);
   * ```
   * Clear the canvas to blue.
   * ```ts
   * cg.clear([0, 0, 1, 1]);
   * ```
   * Clear the canvas to zero alpha for compositing with the page.
   * ```ts
   * const cg = new CandyGraph({ alpha: true });
   * cg.clear([0, 0, 0, 0]);
   * ```
   */
  public clear = (color: [number, number, number, number]): void => {
    this.regl.clear({ color: color as Vec4 });
  };

  /** Renders the given Renderable(s) to the given Viewport with the provided CoordinateSystem.
   * @example
   * ```ts
   * // Create a viewport.
   * const viewport = { x: 0, y: 0, width: 384, height: 384 };
   *
   * // Create a coordinate system.
   * const coords = new CartesianCoordinateSystem(
   *   new LinearScale([0, 1], [32, viewport.width - 16]),
   *   new LinearScale([0, 1], [32, viewport.height - 16])
   * );
   *
   * // Render a line segment to the viewport.
   * cg.render(coords, viewport, new LineSegments(cg, [0, 0, 1, 1]));
   *
   * // Render a couple more line segments to the viewport.
   * cg.render(coords, viewport, [new LineSegments(cg, [0.5, 0, 0.5, 1]), new LineSegments(cg, [0, 1, 1, 0])]);
   * ```
   */
  public render = (coords: CoordinateSystem, viewport: Viewport, renderable: Renderable): void => {
    coords.scope(coords.props(), () => {
      this.scope(
        {
          resolution: [viewport.width, viewport.height],
          viewport,
        },
        () => {
          this.recursiveRender(coords, renderable);
        }
      );
    });
  };

  /** Destroys the underlying `regl` instance and renders this `CandyGraph` instance unusable. */
  public destroy() {
    this.regl.destroy();
  }

  /** Copies the contents of the CandyGraph canvas to another canvas. Returns the HTMLCanvasElement that was copied to.
   * @param sourceViewport The `Viewport` of the `CandyGraph` canvas that will be copied from.
   * @param destinationCanvas The canvas that will be copied to. If not provided, one will be created with the dimensions of `destinationViewport`.
   * @param destinationViewport If not provided, one will be created that is positioned at [0, 0] and with the width and height of `sourceViewport`.
   */
  public copyTo(sourceViewport: Viewport, destinationCanvas?: HTMLCanvasElement, destinationViewport?: Viewport) {
    // If we're not provided a canvas, make one.
    const dest = destinationCanvas ?? document.createElement("canvas");

    // If we're not provided a destination viewport, make one the size of the source viewport.
    destinationViewport = destinationViewport ?? {
      x: 0,
      y: 0,
      width: sourceViewport.width,
      height: sourceViewport.height,
    };

    // If we weren't provided a destination canvas, size it according to destinationViewport.
    if (!destinationCanvas) {
      dest.width = destinationViewport.x + destinationViewport.width;
      dest.height = destinationViewport.y + destinationViewport.height;
    }

    // Copy the canvas.
    const ctx = dest.getContext("2d");
    ctx?.drawImage(
      this.canvas,
      0,
      this.canvas.height - sourceViewport.height,
      sourceViewport.width,
      sourceViewport.height,
      destinationViewport.x,
      destinationViewport.y,
      destinationViewport.width,
      destinationViewport.height
    );

    return dest;
  }

  private getCommand(coords: CoordinateSystem, primitive: Primitive) {
    let commands = this.commandCache.get(coords.glsl);
    if (!commands) {
      commands = new Map<Function, DrawCommand>();
      this.commandCache.set(coords.glsl, commands);
    }
    let command = commands.get(primitive.constructor);
    if (!command) {
      command = primitive.command(coords.glsl + commonGLSL);
      commands.set(primitive.constructor, command);
    }
    return command;
  }

  private recursiveRender(coords: CoordinateSystem, renderable: Renderable) {
    if (Array.isArray(renderable)) {
      for (const element of renderable) {
        this.recursiveRender(coords, element);
      }
    } else {
      if (renderable.kind === RenderableType.Primitive) {
        const command = this.getCommand(coords, renderable);
        renderable.render(command);
      } else if (renderable.kind === RenderableType.Composite) {
        if (renderable.scope) {
          renderable.scope(renderable.props(coords), () => {
            this.recursiveRender(coords, renderable.children());
          });
        } else {
          this.recursiveRender(coords, renderable.children());
        }
      }
    }
  }
}
