import inlineWorkerSource from 'inline-worker-source';

import type { ApiPollerWorkerOptions, ControlMessage, Msg, WorkerMessage } from './types';

/**
 * Polls an API in a web worker, and tells you what changed in each response.
 */
export class ApiPollerWorker<T> {
  private readonly worker: Worker;

  private readonly listeners = new Set<(msg: Msg<T>) => void>();

  private readonly errorListeners = new Set<(error: Error) => void>();

  private started = false;

  // The URL of the inline worker's source, revoked when the worker is terminated.
  private inlineUrl: string | undefined;

  constructor(options: ApiPollerWorkerOptions) {
    const { autoStart = true } = options;

    this.worker = this.createWorker(options);

    this.worker.addEventListener('message', (event: MessageEvent<WorkerMessage<T>>) => {
      const { data } = event;

      if (data.type === 'update') {
        for (const listener of this.listeners) {
          listener(data.msg);
        }
      } else {
        const error = new Error(data.message);

        for (const listener of this.errorListeners) {
          listener(error);
        }
      }
    });

    if (options.inline) {
      this.send({
        type: 'init',
        options: {
          url: options.apiUrl ?? '',
          fetchOptions: options.fetchOptions,
          interval: options.interval,
          uniqueKey: options.uniqueKey,
        },
      });
    }

    if (autoStart) {
      this.start();
    }
  }

  /** Start polling. */
  start() {
    if (!this.started) {
      this.started = true;
      this.send({ type: 'start' });
    }

    return this;
  }

  /** Stop polling. Call `start` to poll again. */
  stop() {
    if (this.started) {
      this.started = false;
      this.send({ type: 'stop' });
    }

    return this;
  }

  /** Call `callback` with what changed after each response. */
  onMessage(callback: (msg: Msg<T>) => void) {
    this.listeners.add(callback);

    return this;
  }

  /** Call `callback` when a request fails, or the response isn't an array of objects. */
  onError(callback: (error: Error) => void) {
    this.errorListeners.add(callback);

    return this;
  }

  /** Stop polling and shut the worker down for good. */
  terminate() {
    this.started = false;
    this.worker.terminate();

    if (this.inlineUrl) {
      URL.revokeObjectURL(this.inlineUrl);
      this.inlineUrl = undefined;
    }
  }

  private send(message: ControlMessage) {
    this.worker.postMessage(message);
  }

  private createWorker(options: ApiPollerWorkerOptions) {
    if (options.inline) {
      if (!options.apiUrl) {
        throw new Error('[ApiPollerWorker] "inline" is set, but no "apiUrl" was provided.');
      }

      this.inlineUrl = URL.createObjectURL(
        new Blob([inlineWorkerSource], { type: 'text/javascript' }),
      );

      return new Worker(this.inlineUrl);
    }

    if (options.worker) {
      return options.worker;
    }

    if (options.workerUrl) {
      return new Worker(options.workerUrl);
    }

    throw new Error(
      '[ApiPollerWorker] Provide "worker" or "workerUrl", or set "inline" with an "apiUrl".',
    );
  }
}
