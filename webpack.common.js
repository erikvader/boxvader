const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/client/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    alias: {
      pson: 'pson/dist/PSON.js',
      Long: 'long/index.js',
      ByteBuffer: 'bytebuffer/index.js',
    },
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
