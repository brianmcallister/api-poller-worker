/**
 * The worker that `ApiPollerWorker` creates when `inline` is set. It's bundled into a string at
 * build time. It waits for its options in an `init` message, then hands over to `WorkerCore`.
 */
import { WorkerCore, type WorkerScope } from './WorkerCore';
import type { ControlMessage } from './types';

const scope = globalThis as unknown as WorkerScope & {
  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent<ControlMessage>) => void,
  ): void;
};

const init = (event: MessageEvent<ControlMessage>) => {
  if (event.data.type === 'init') {
    scope.removeEventListener('message', init);
    new WorkerCore(event.data.options, scope);
  }
};

scope.addEventListener('message', init);
