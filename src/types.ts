export interface Records<T> {
  ids: string[];
  byId: { [id: string]: T };
}

export interface Msg<T> {
  newItems: Records<T>;
  updatedItems: Records<T>;
  removedItems: string[];
}

export interface ApiPollerWorkerOptions {
  workerUrl: string;
  autoStart?: boolean;
}
