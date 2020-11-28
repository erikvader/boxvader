const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  optimization: {
    minimize: false,
  },
  devtool: 'source-map',
});
