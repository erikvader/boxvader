const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/client/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  mode: 'development',
  optimization: {
    minimize: false,
  },
  devtool: 'source-map',
  resolve: {
    alias: {
      pson: 'pson/dist/PSON.js',
      Long: 'long/index.js',
      ByteBuffer: 'bytebuffer/index.js',
    },
    fallback: {
      path: require.resolve('path-browserify'),
    },
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader?configFile=tsconfig.webpack.json',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BROWSER': JSON.stringify('yes'),
    }),
  ],
};
