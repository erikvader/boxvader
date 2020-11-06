const path = require('path');

module.exports = {
    entry: './src/browser/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    mode: "development",
    optimization: {
        minimize: false
    }
};
