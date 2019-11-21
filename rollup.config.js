import path from 'path';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';

function test() {
  return {
    name: 'my-example', // this name will show up in warnings and errors
    generateBundle(options, bundle) {
      const { code } = bundle['inlineWorker.js'];

      bundle['inlineWorker.js'].code = `module.exports.default = \`${code}\`;`;

      return null;
    }
  };
}

module.exports = {
  input: 'src/inlineWorker.ts',
  output: {
    file: path.resolve(__dirname, 'dist', 'inlineWorker.js'),
    format: 'iife',
  },
  plugins: [test(), babel(), typescript({ removeComments: true, target: 'es5' })],
};
