import { Msg } from './types';

interface Options {
  workerUrl: string;
}

/**
 * ApiPollerWorker class.
 * @class
 */
export default class ApiPollerWorker<T> {
  // Worker instance.
  worker: Worker;

  // Set of message event listeners.
  listeners: Set<(data: Msg<T>) => void>;

  /**
   * Constructor.
   * @constructor
   */
  constructor(options: Options) {
    const { workerUrl } = options;

    this.worker = new Worker(workerUrl);
    this.listeners = new Set();

    this.worker.addEventListener('message', (event) => {
      const { data } = event;

      this.listeners.forEach(listener => listener(data));
    });
  }

  /**
   * Subscribe to message events from the worker instance.
   */
  onMessage = (callback: (data: Msg<T>) => void) => {
    this.listeners.add(callback);
  }
}
