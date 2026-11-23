import { Poller } from './Poller';
import { diff, normalize } from './records';
import type { ControlMessage, Records, WorkerCoreOptions, WorkerMessage } from './types';

/** The parts of a worker's global scope that `WorkerCore` uses. */
export interface WorkerScope {
  addEventListener(type: 'message', listener: (event: MessageEvent<ControlMessage>) => void): void;
  postMessage(message: unknown): void;
}

/**
 * Polls an API from inside a worker, and sends the page what changed since the last response.
 *
 * Create one in your worker script. The page controls it with `ApiPollerWorker`.
 */
export class WorkerCore<T extends object> {
  private records: Records<T> = { ids: [], byId: {} };

  private readonly poller: Poller<T>;

  // The scope defaults to the worker's global scope. It's looked up here, rather than when this
  // module loads, so the package can be imported outside a worker.
  constructor(options: WorkerCoreOptions, scope: WorkerScope = globalThis) {
    const { url, uniqueKey = 'id', interval = 2000, fetchOptions } = options;
    const send = (message: WorkerMessage<T>) => {
      scope.postMessage(message);
    };

    this.poller = new Poller<T>({ url, interval, fetchOptions });

    scope.addEventListener('message', (event) => {
      if (event.data.type === 'start') {
        this.poller.start();
      } else if (event.data.type === 'stop') {
        this.poller.stop();
      }
    });

    this.poller.subscribe((data) => {
      try {
        const records = normalize(data, uniqueKey);
        const msg = diff(this.records, records);

        this.records = records;
        send({ type: 'update', msg });
      } catch (error) {
        send({ type: 'error', message: error instanceof Error ? error.message : String(error) });
      }
    });

    this.poller.onError((error) => {
      send({ type: 'error', message: error.message });
    });
  }
}
