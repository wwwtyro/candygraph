const webpack = require("webpack");
const path = require("path");

const root = path.resolve(__dirname);

module.exports = {
  context: root,
  mode: "development",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(root, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    contentBase: path.resolve(root, "dist"),
    host: "0.0.0.0",
    port: 8081,
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};
