const path = require("path");

module.exports = {
  mode: "development",
  entry: "./examples/arm/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/",
  },
  devServer: {
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
  },
};
