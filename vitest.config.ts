import { defineConfig } from 'vitest/config';

import { buildInlineWorkerModule, INLINE_WORKER_MODULE } from './build/inlineWorker';

export default defineConfig({
  plugins: [
    {
      // Build the inline worker the same way the package build does.
      name: 'inline-worker',
      resolveId: (id) => (id === INLINE_WORKER_MODULE ? `\0${INLINE_WORKER_MODULE}` : undefined),
      load: (id) => (id === `\0${INLINE_WORKER_MODULE}` ? buildInlineWorkerModule() : undefined),
    },
  ],
  test: {
    environment: 'node',
    coverage: {
      include: ['src'],
    },
  },
});
