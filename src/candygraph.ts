import REGL, { DrawCommand, Regl, Vec4 } from "regl";
import { CoordinateSystem } from "./coordinates/coordinate-system";
import {
  Viewport,
  Renderable,
  RenderableType,
  Primitive,
  NumberArray,
} from "./common";
import { createDataset } from "./primitives/dataset";

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

type CandyGraphOptions = {
  canvas?: HTMLCanvasElement;
  alpha?: boolean;
};

const DEFAULT_OPTIONS = {
  canvas: null,
  alpha: false,
};

export class CandyGraph {
  public readonly regl: Regl;
  public readonly canvas: HTMLCanvasElement;

  private commandCache: { [glsl: string]: Map<Function, DrawCommand> } = {};
  private coordinateScopeCache = new Map<CoordinateSystem, DrawCommand>();
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
        premultipliedAlpha: false,
      },
    });
    this.scope = this.regl({
      uniforms: {
        resolution: this.regl.prop<Props, "resolution">("resolution"),
      },
      viewport: this.regl.prop<Props, "viewport">("viewport"),
      blend: {
        enable: true,
        func: { src: "src alpha", dst: "one minus src alpha" },
      },
      depth: {
        enable: false,
      },
    });
  }

  public clear = (color: [number, number, number, number]): void => {
    this.regl.clear({ color: color as Vec4 });
  };

  public render = (
    coords: CoordinateSystem,
    viewport: Viewport,
    renderable: Renderable
  ): void => {
    this.getCoordinateScope(coords)({ ...coords.props() }, () => {
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

  public copyTo(
    sourceViewport: Viewport,
    destinationCanvas?: HTMLCanvasElement,
    destinationViewport?: Viewport
  ) {
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

  private recursiveRender(coords: CoordinateSystem, renderable: Renderable) {
    if (Array.isArray(renderable)) {
      for (const element of renderable) {
        this.recursiveRender(coords, element);
      }
    } else {
      if (renderable.kind === RenderableType.Primitive) {
        const command = this.getCommand(coords, renderable);
        renderable.render(command);
        if (!renderable.retained) {
          renderable.dispose();
        }
      } else if (renderable.kind === RenderableType.Composite) {
        this.recursiveRender(coords, renderable.children());
      }
    }
  }

  private getCommand(coords: CoordinateSystem, primitive: Primitive) {
    let m0 = this.commandCache[coords.glsl];
    if (!m0) {
      m0 = new Map<Function, DrawCommand>();
      this.commandCache[coords.glsl] = m0;
    }
    let command = m0.get(primitive.constructor);
    if (!command) {
      command = primitive.command(coords.glsl + commonGLSL);
      m0.set(primitive.constructor, command);
    }
    return command;
  }

  private getCoordinateScope(coords: CoordinateSystem) {
    let scope = this.coordinateScopeCache.get(coords);
    if (!scope) {
      scope = coords.scope(this.regl);
      this.coordinateScopeCache.set(coords, scope);
    }
    return scope;
  }
}
