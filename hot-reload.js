const ChromeExtensionReloader = require("webpack-chrome-extension-reloader");
const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const config = require("./webpack.config.js");

const compiler = webpack(config);

const server = new WebpackDevServer(compiler, {
  hot: true,
  contentBase: "./dist",
  headers: { "Access-Control-Allow-Origin": "*" },
});

server.listen(3000, "localhost", function () {});

new ChromeExtensionReloader({
  port: 9090,
  reloadPage: true,
  entries: {
    background: "background",
  },
}).apply(compiler);
