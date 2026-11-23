import { defineConfig } from 'tsup';

import { buildInlineWorkerModule, INLINE_WORKER_MODULE } from './build/inlineWorker';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2020',
  esbuildPlugins: [
    {
      name: 'inline-worker',
      setup(build) {
        build.onResolve({ filter: new RegExp(`^${INLINE_WORKER_MODULE}$`) }, () => ({
          path: INLINE_WORKER_MODULE,
          namespace: 'inline-worker',
        }));
        build.onLoad({ filter: /.*/, namespace: 'inline-worker' }, async () => ({
          contents: await buildInlineWorkerModule(),
          loader: 'js',
        }));
      },
    },
  ],
});
