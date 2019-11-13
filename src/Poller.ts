interface ApiPollerOptions {
  url: string;
  interval?: number;
  fetchOptions?: RequestInit;
}

export default class ApiPoller<T> {
  intervalId: number | undefined;
  listeners: Set<(data: T[]) => void>;
  requestPending: boolean = false;
  request: RequestInit | undefined;
  options: ApiPollerOptions;
  interval: number;

  constructor(options: ApiPollerOptions) {
    this.options = options;
    this.interval = options.interval || 2000;
    this.listeners = new Set();
  }

  onData = (callback: (data: T[]) => void) => {
    this.listeners.add(callback);

    return this;
  }

  start = () => {
    this.makeRequest();
    this.intervalId = setInterval(this.makeRequest, this.interval);

    return this;
  }

  stop = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    return this;
  }

  private makeRequest = () => {
    if (this.requestPending) {
      return;
    }

    fetch(this.options.url, this.options.fetchOptions)
      .then(res => res.json())
      .then((json) => {
        this.listeners.forEach(listener => listener(json));

        return json;
      })
      // eslint-disable-next-line no-console
      .catch(err => console.error(err));
  }
}
