import { Factory as FontFactory, Font } from "../primitives/font";

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((accept) => {
    const image = new Image();
    image.onload = () => accept(image);
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

export function createDefaultFont(createFont: FontFactory) {
  return new Promise<Font>(async (accept) => {
    const image = await loadImage(
      require("./Lato-Regular.png").default
    );
    const json = require("./Lato-Regular.json");
    const font = createFont(image, json);
    accept(font);
  });
}