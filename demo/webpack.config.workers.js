const path = require('path');

const { NODE_ENV: env = 'development' } = process.env;

module.exports = {
  mode: env,
  entry: [
    './workers/worker.ts'
  ],
  output: {
    path: path.resolve(__dirname, 'workers-dist'),
    filename: '[name].bundle.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        include: path.resolve(__dirname, 'workers'),
        loader: 'babel-loader',
      },
    ],
  },
};
