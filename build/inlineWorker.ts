import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

/** The import that ApiPollerWorker uses for the inline worker's source. */
export const INLINE_WORKER_MODULE = 'inline-worker-source';

/**
 * Bundle `src/inlineWorker.ts` and everything it imports into one script, and return the code of a
 * module that exports it as a string.
 */
export const buildInlineWorkerModule = async () => {
  const result = await build({
    entryPoints: [fileURLToPath(new URL('../src/inlineWorker.ts', import.meta.url))],
    bundle: true,
    format: 'iife',
    minify: true,
    target: 'es2020',
    write: false,
  });
  const [output] = result.outputFiles;

  if (!output) {
    throw new Error('Building the inline worker produced no output');
  }

  return `export default ${JSON.stringify(output.text)};`;
};
