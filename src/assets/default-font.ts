import { CandyGraph } from "../candygraph";
import { Font, createFont } from "../primitives/font";

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((accept) => {
    const image = new Image();
    image.onload = () => accept(image);
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

export function createDefaultFont(cg: CandyGraph) {
  return new Promise<Font>(async (accept) => {
    const image = await loadImage(
      require("./Lato-Regular.png").default
    );
    const json = require("./Lato-Regular.json");
    const font = createFont(cg, image, json);
    accept(font);
  });
}