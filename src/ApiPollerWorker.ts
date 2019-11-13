interface Msg<T> {
  new: T[];
  updated: T[];
  deleted: T[];
}

interface Options {
  apiUrl: string;
  workerUrl: string;
  interval?: number;
}

export default class ApiPollerWorker<T> {
  worker: Worker;
  listeners: Set<(data: Msg<T>) => void>;

  constructor(options: Options) {
    const { workerUrl, apiUrl, interval = 2000 } = options;
    this.worker = new Worker(workerUrl);
    this.listeners = new Set();

    this.worker.onmessage = (event) => {
      const { data } = event;

      this.listeners.forEach(listener => listener(data));
    }

    this.worker.postMessage({
      type: 'init',
      message: {
        ...options,
      }
    })
  }

  onMessage = (callback: (data: Msg<T>) => void) => {
    this.listeners.add(callback);
  }

  send = (message: any) => this.worker.postMessage({ type: 'api', message });
}
