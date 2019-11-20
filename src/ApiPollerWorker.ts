import { ApiPollerWorkerOptions, Msg } from './types';

/**
 * ApiPollerWorker class.
 * @class
 */
export default class ApiPollerWorker<T> {
  // Worker instance.
  private worker: Worker;

  // Set of message event listeners.
  private listeners: Set<(data: Msg<T>) => void>;

  // Keep track of if we've started polling.
  private started = false;

  /**
   * Constructor.
   * @constructor
   */
  constructor(options: ApiPollerWorkerOptions) {
    const { autoStart = true, workerUrl } = options;

    this.worker = new Worker(workerUrl);
    this.listeners = new Set();

    this.worker.addEventListener('message', event => {
      const { data } = event;

      this.listeners.forEach(listener => listener(data));
    });

    // Automatically start polling right away.
    if (autoStart) {
      this.start();
    }
  }

  /**
   * Send a start message to the worker.
   */
  start = () => {
    if (this.started) {
      return this;
    }

    this.started = true;
    this.worker.postMessage({ type: 'start' });

    return this;
  };

  /**
   * Send a stop message to the worker.
   */
  stop = () => {
    if (!this.started) {
      return this;
    }

    this.started = false;
    this.worker.postMessage({ type: 'stop' });

    return this;
  };

  /**
   * Subscribe to message events from the worker instance.
   */
  onMessage = (callback: (data: Msg<T>) => void) => {
    this.listeners.add(callback);

    return this;
  };
}
