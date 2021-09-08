const webpack = require("webpack");
const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    library: "candygraph",
    libraryTarget: "umd",
  },
  module: {
    rules: [{ test: /\.ts$/, loader: "ts-loader" }],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: "source-map",
};
