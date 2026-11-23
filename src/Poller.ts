export interface PollerOptions {
  fetchOptions?: RequestInit;
  interval?: number;
  url: string;
}

/**
 * Polls an API endpoint that responds with a JSON array.
 */
export class Poller<T> {
  private intervalId: ReturnType<typeof setInterval> | undefined;

  private requestPending = false;

  private readonly listeners = new Set<(data: T[]) => void>();

  private readonly errorListeners = new Set<(error: Error) => void>();

  private readonly options: PollerOptions;

  constructor(options: PollerOptions) {
    this.options = options;
  }

  /** Start polling, with the first request right away. */
  start() {
    this.stop();
    void this.request();
    this.intervalId = setInterval(() => void this.request(), this.options.interval ?? 2000);

    return this;
  }

  /** Stop polling. */
  stop() {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    return this;
  }

  /** Call `callback` with each response. */
  subscribe(callback: (data: T[]) => void) {
    this.listeners.add(callback);

    return this;
  }

  /** Call `callback` when a request fails or the response isn't an array. */
  onError(callback: (error: Error) => void) {
    this.errorListeners.add(callback);

    return this;
  }

  private async request() {
    // Don't stack up requests when the API is slower than the interval.
    if (this.requestPending) {
      return;
    }

    this.requestPending = true;

    try {
      const response = await fetch(this.options.url, this.options.fetchOptions);

      if (!response.ok) {
        throw new Error(`Request failed with status ${String(response.status)}`);
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Expected the API to respond with a JSON array');
      }

      for (const listener of this.listeners) {
        listener(data as T[]);
      }
    } catch (error) {
      const reported = error instanceof Error ? error : new Error(String(error));

      for (const listener of this.errorListeners) {
        listener(reported);
      }
    } finally {
      this.requestPending = false;
    }
  }
}
