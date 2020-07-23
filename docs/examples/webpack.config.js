const webpack = require("webpack");
const path = require("path");
const { execSync } = require("child_process");

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
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.beforeCompile.tap("RenderHTML", (compilation) => {
          execSync(`cd ${root} && node render-html.js`);
        });
      },
    },
  ],
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
  },
  resolve: {
    extensions: [".ts", ".js", ".md"],
  },
};
