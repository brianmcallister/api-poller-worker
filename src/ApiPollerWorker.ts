import { ApiPollerWorkerOptions, Msg } from './types';

/**
 * ApiPollerWorker class.
 * @class
 */
export default class ApiPollerWorker<T> {
  // Worker instance.
  // @private
  private worker: Worker;

  // Set of message event listeners.
  // @private
  private listeners: Set<(data: Msg<T>) => void>;

  // Keep track of if we've started polling.
  // @private
  private started = false;

  // Default constructor options.
  // @private
  // @static
  private static defaultOptions = {
    inline: false,
    autoStart: true,
  };

  /**
   * Constructor.
   * @constructor
   */
  constructor(rawOptions: ApiPollerWorkerOptions) {
    const options = { ...ApiPollerWorker.defaultOptions, ...rawOptions };
    const { autoStart } = options;

    this.worker = new Worker(ApiPollerWorker.getWorkerSrc(options));
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
   * Get the workerSrc, which might be inline, or might just be
   * a URL.
   */
  private static getWorkerSrc(options: ApiPollerWorkerOptions) {
    const { inline, apiUrl, workerUrl } = options;

    if (inline) {
      if (!apiUrl) {
        throw new Error(
          '[ApiPollerWorker] The "inline" option is set to "true", but no "apiUrl" was provided.',
        );
      }

      return ApiPollerWorker.createInlineWorker(apiUrl);
    }

    if (!workerUrl) {
      throw new Error('[ApiPollerWorker] The "workerUrl" option was not provided.');
    }

    return workerUrl;
  }

  /**
   * Create an inline worker using `Blob`.
   * @private
   * @static
   */
  private static createInlineWorker(apiUrl: string) {
    // This is weird and not obvious what's going on just from
    // reading the source. In the `src` directory, this is
    // pointing at the TypeScript version of inlineWorker.
    // However, the compiled version of inlineWorker is _not_
    // passed through `tsc`. Instead, it gets built with
    // Rollup. The reason for this is because it's being inlined
    // as a Blob, and then turned into a string, it needs
    // to be bundled to run in a worker context (the rest of
    // the files in this project are not bundled for the web,
    // with the expectation that consumers of this package have
    // a build pipeline for their web applications already in
    // place).
    // eslint-disable-next-line global-require
    const inlineWorker: { default: string } = require('./inlineWorker');
    const blob = new Blob([inlineWorker.default.replace('%%__REPLACE__%%', apiUrl)]);

    return window.URL.createObjectURL(blob);
  }

  /**
   * Send a start message to the worker.
   */
  start() {
    if (this.started) {
      return this;
    }

    this.started = true;
    this.worker.postMessage({ type: 'start' });

    return this;
  }

  /**
   * Send a stop message to the worker.
   */
  stop() {
    if (!this.started) {
      return this;
    }

    this.started = false;
    this.worker.postMessage({ type: 'stop' });

    return this;
  }

  /**
   * Subscribe to message events from the worker instance.
   */
  onMessage(callback: (data: Msg<T>) => void) {
    this.listeners.add(callback);

    return this;
  }
}
