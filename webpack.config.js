const path = require("path");

const examplesDir = path.resolve(__dirname, "examples");
const exampleNames = ["bvh", "prims", "arm", "cannon", "renderpasses"]

const configs = exampleNames.map((name) => ({
  name,
  mode: "development",
  entry: path.join(examplesDir, name, "index.js"),
  output: {
    filename: `${name}/bundle.js`,
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/",
  },
}));

// tack on the dev server to the firs one
// i think this means losing hot reloading for the other
// ones but thats ok
configs[0].devServer = {
  static: {
    directory: path.resolve(__dirname),
    watch: {
      ignored: /dist/,
    },
  },

  devMiddleware: {
    writeToDisk: true,
  },

  hot: true,
  liveReload: true,
  compress: true,
  port: 8080,
  open: false,
};

module.exports = configs;
