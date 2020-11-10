const path = require('path');

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
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader?configFile=tsconfig.webpack.json',
      },
    ],
  },
};
