import path from 'path';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';

/**
 * Rollup plugin to wrap in the inlineWorker in a string.
 */
function wrapInlineWorker() {
  return {
    name: 'wrap-inline-worker',
    generateBundle(_, bundle) {
      const { code } = bundle['inlineWorker.js'];

      // eslint-disable-next-line no-param-reassign
      bundle['inlineWorker.js'].code = `module.exports.default = \`${code}\`;`;

      return null;
    },
  };
}

module.exports = {
  input: 'src/inlineWorker.ts',
  output: {
    file: path.resolve(__dirname, 'dist', 'inlineWorker.js'),
    format: 'iife',
  },
  plugins: [wrapInlineWorker(), babel(), typescript({ removeComments: true, target: 'es5' })],
};
