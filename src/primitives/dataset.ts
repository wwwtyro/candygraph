import { Regl, Buffer } from "regl";

import { CandyGraph } from "..";

export type Factory = ReturnType<typeof factory>

export function factory(cg: CandyGraph) {
  return function (
    data: number | number[] | number[][] | Float32Array | Dataset,
    auto = true
  ) {
    return createDataset(cg.regl, data, auto);
  }
}

export function createDataset(
  regl: Regl,
  data: number | number[] | number[][] | Float32Array | Dataset,
  auto = true
) {
  if (isDataset(data)) {
    return data;
  }
  return new Dataset(regl, data, auto);
}

function isDataset(obj: any): obj is Dataset {
  return obj.constructor === Dataset;
}

export class Dataset {
  public readonly buffer: Buffer;
  private _length = 0;
  private _disposed = false;

  constructor(
    regl: Regl,
    data: number | number[] | number[][] | Float32Array,
    private auto: boolean
  ) {
    this.buffer = regl.buffer(1);
    this.update(data);
  }

  public update = (data: number | number[] | number[][] | Float32Array) => {
    if (this._disposed) {
      throw new Error(
        "This DataSet cannot be updated, it's already been disposed."
      );
    }
    if (typeof data === "number") {
      this.buffer([data]);
      this._length = 1;
    } else if (ArrayBuffer.isView(data)) {
      this.buffer(data);
      this._length = data.length;
    } else if (Array.isArray(data)) {
      this.buffer(data);
      if (typeof data[0] === "number") {
        this._length = data.length;
      } else {
        this._length = data.length * data[0].length;
      }
    }
    return this;
  };

  public dispose() {
    this.buffer.destroy();
    this._disposed = true;
  }

  public disposeIfAuto() {
    if (this.auto) {
      this.dispose();
    }
  }

  public count(size: number) {
    this.assertFits(size);
    return this._length / size;
  }

  public divisor(instances: number, size: number) {
    const count = this.count(size);
    if (count === 1) {
      return instances;
    }
    return 1;
  }

  private assertFits(size: number) {
    if (this._length % size !== 0) {
      throw new Error(
        `Attempted to use incompatible size ${size} with data of length ${this._length}.`
      );
    }
  }
}
