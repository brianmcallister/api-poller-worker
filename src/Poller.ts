interface ApiPollerOptions {
  url: string;
  interval?: number;
  fetchOptions?: RequestInit;
}

/**
 * ApiPoller class
 * @class
 *
 * Acceps a generic, `T`, which represents the type
 * of data returned by the polled endpoint.
 */
export default class ApiPoller<T> {
  // Main polling interval ID.
  intervalId: NodeJS.Timeout | undefined;

  // Set of listeners to be called when the API responds.
  listeners: Set<(data: T[]) => void>;

  // Track if there's a pending request. No need to
  // queue up requests here.
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  requestPending: boolean = false;

  // Class options.
  options: ApiPollerOptions;

  // How often should the API endpoint be polled?
  interval: number;

  /**
   * Constructor.
   * @constructor
   */
  constructor(options: ApiPollerOptions) {
    this.options = options;
    this.interval = options.interval || 2000;
    this.listeners = new Set();
  }

  /**
   * Start polling the API endpoint.
   */
  start = () => {
    this.makeRequest();
    this.intervalId = setInterval(this.makeRequest, this.interval);

    return this;
  }

  /**
   * Stop polling.
   */
  stop = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    return this;
  }

  /**
   * Subscribe to updates from the API endpoint.
   */
  subscribe = (callback: (data: T[]) => void) => {
    this.listeners.add(callback);

    return this;
  }

  /**
   * Make the API request.
   * @private
   */
  private makeRequest = async () => {
    if (this.requestPending) {
      return;
    }

    const { url, fetchOptions } = this.options;

    try {
      this.requestPending = true;

      const req = await fetch(url, fetchOptions);
      const json = await req.json();

      this.listeners.forEach(listener => listener(json));

      this.requestPending = false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }
}
