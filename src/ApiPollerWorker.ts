import { Msg } from './types';

interface Options {
  workerUrl: string;
}

export default class ApiPollerWorker<T> {
  worker: Worker;

  listeners: Set<(data: Msg<T>) => void>;

  constructor(options: Options) {
    const { workerUrl } = options;
    this.worker = new Worker(workerUrl);
    this.listeners = new Set();

    this.worker.addEventListener('message', (event) => {
      const { data } = event;

      this.listeners.forEach(listener => listener(data));
    });
  }

  onMessage = (callback: (data: Msg<T>) => void) => {
    this.listeners.add(callback);
  }
}
