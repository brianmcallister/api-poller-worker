/** Resources keyed by their unique ID, plus the IDs in the order the API returned them. */
export interface Records<T> {
  ids: string[];
  byId: Record<string, T>;
}

/** What changed between two responses from the API. */
export interface Msg<T> {
  newItems: Records<T>;
  updatedItems: Records<T>;
  removedItems: string[];
}

/** Options for the code that polls the API, inside the worker. */
export interface WorkerCoreOptions {
  /** The API endpoint to poll. It must respond with a JSON array of objects. */
  url: string;
  /** Options passed to `fetch`. They must be structured-clonable, so use a plain `headers` object. */
  fetchOptions?: RequestInit;
  /** How often to poll, in milliseconds. Defaults to 2000. */
  interval?: number;
  /** The property that uniquely identifies each object. Defaults to `id`. */
  uniqueKey?: string;
}

export interface ApiPollerWorkerOptions {
  /**
   * Poll `apiUrl` with a worker built into this package, instead of your own. Use `interval`,
   * `uniqueKey` and `fetchOptions` to configure it.
   */
  inline?: boolean;
  /** The API endpoint to poll, when `inline` is set. */
  apiUrl?: string;
  /** Options passed to `fetch`, when `inline` is set. */
  fetchOptions?: RequestInit;
  /** How often to poll, in milliseconds, when `inline` is set. Defaults to 2000. */
  interval?: number;
  /** The property that uniquely identifies each object, when `inline` is set. Defaults to `id`. */
  uniqueKey?: string;
  /** Your own worker, which creates a `WorkerCore`. */
  worker?: Worker;
  /** The URL of your own worker script, which creates a `WorkerCore`. */
  workerUrl?: string | URL;
  /** Start polling right away. Defaults to true. */
  autoStart?: boolean;
}

/** Messages the worker sends to the page. */
export type WorkerMessage<T> = { type: 'update'; msg: Msg<T> } | { type: 'error'; message: string };

/** Messages the page sends to the worker. */
export type ControlMessage =
  { type: 'init'; options: WorkerCoreOptions } | { type: 'start' } | { type: 'stop' };
