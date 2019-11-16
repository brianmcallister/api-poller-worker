require('dotenv').config();

const path = require('path');
const webpack = require('webpack');

const { POLLING_API_URL, NODE_ENV: env = 'development' } = process.env;

module.exports = {
  mode: env,
  entry: [
    './workers/worker.ts',
  ],
  output: {
    path: path.resolve(__dirname, 'dist', 'workers'),
    filename: '[name].worker.bundle.js',
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
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(env),
        POLLING_API_URL: JSON.stringify(POLLING_API_URL),
      },
    }),
  ],
};
