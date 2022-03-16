import { Regl, Buffer } from "regl";
import { CandyGraph } from "../candygraph";

type Data = number | number[] | number[][] | Float32Array | Dataset;

export function createDataset(regl: Regl, data: Data) {
  if (isDataset(data)) {
    return data;
  }
  return new Dataset(regl, data);
}

// Added to keep the public API the same. I.e., like createRects this function
// expects CandyGraph as the first argument.
export function createDatasetPublic(cg: CandyGraph, data: Data) {
  return createDataset(cg.regl, data);
}

function isDataset(obj: any): obj is Dataset {
  return obj.constructor === Dataset;
}

export class Dataset {
  public readonly buffer: Buffer;
  private length = 0;
  private disposed = false;

  constructor(regl: Regl, data: number | number[] | number[][] | Float32Array) {
    this.buffer = regl.buffer(1);
    this.update(data);
  }

  public update = (data: number | number[] | number[][] | Float32Array) => {
    if (this.disposed) {
      throw new Error("This DataSet cannot be updated, it's already been disposed.");
    }
    if (typeof data === "number") {
      this.buffer([data]);
      this.length = 1;
    } else if (ArrayBuffer.isView(data)) {
      this.buffer(data);
      this.length = data.length;
    } else if (Array.isArray(data)) {
      this.buffer(data);
      if (typeof data[0] === "number") {
        this.length = data.length;
      } else {
        this.length = data.length * data[0].length;
      }
    }
    return this;
  };

  public dispose() {
    this.buffer.destroy();
    this.disposed = true;
  }

  public count(size: number) {
    this.assertFits(size);
    return this.length / size;
  }

  public divisor(instances: number, size: number) {
    const count = this.count(size);
    if (count === 1) {
      return instances;
    }
    return 1;
  }

  private assertFits(size: number) {
    if (this.length % size !== 0) {
      throw new Error(`Attempted to use incompatible size ${size} with data of length ${this.length}.`);
    }
  }
}
