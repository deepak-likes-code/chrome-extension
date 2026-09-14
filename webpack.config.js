const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    main: "./src/index.tsx",
    background: "./src/service-worker.ts",
    sidepanel: "./src/sidepanel.tsx",
    blocked: "./src/blocked.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public", "index.html"),
      chunks: ["main"],
    }),
    new HtmlWebpackPlugin({
      filename: "sidepanel.html",
      template: path.resolve(__dirname, "public", "sidepanel.html"),
      chunks: ["sidepanel"],
    }),
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "icons", to: "icons" },
        { from: "public/background/focustab-scottish-valley.jpg", to: "background/focustab-scottish-valley.jpg" },
        { from: "src/blocked.html", to: "blocked.html" },
      ],
    }),
  ],
  mode: "development",
  devtool: false,
};
