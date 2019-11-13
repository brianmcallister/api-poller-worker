import Poller from './Poller';

interface WorkerCoreOptions {
  url: string;
  uniqueKey?: string;
}

interface Records<T> {
  ids: string[];
  byId: { [id: string]: T };
}

const ctx: Worker = self as any;

function normalize<T extends {}>(data: T[], uniqueKey: string) {
  const ids: string[] = [];
  const byId: { [id: string]: T } = {};

  data.forEach((datum: T) => {
    if (!datum.hasOwnProperty(uniqueKey)) {
      throw new Error(`Resource does not have key named: "${uniqueKey}"`);
    }

    // At this point, we have no idea what `datum` is going to be,
    // beyond it being some kind of ojbect, so we need to rely on
    // runtime checks to make sure the unique key actually exists
    // on this object.
    // @ts-ignore
    const id: string = datum[uniqueKey];

    ids.push(id);
    byId[id] = datum;
  });

  return { ids, byId };
}

function diff<T extends {}>(before: Records<T>, after: Records<T>) {
  const { ids: beforeIds } = before;
  const { ids: afterIds } = after;

  const newIds = afterIds.filter(id => !beforeIds.includes(id));
  const newItems = newIds.map(id => after.byId[id]);
  const removedIds = afterIds.filter(id => !beforeIds.includes(id));

  return {
    newItems: {
      ids: newIds,
      byId: newItems,
    },
    removedItems: removedIds,
  }
}

export default class WorkerCore<T> {
  records: Records<T>;

  constructor(options: WorkerCoreOptions) {
    const { url, uniqueKey = 'id' } = options;
    const poller = new Poller<T>({ url });

    this.records = {
      ids: [],
      byId: {},
    }

    poller.start().onData(data => {
      const normalized = normalize<T>(data, uniqueKey);
      const update = diff<T>(this.records, normalized);

      this.records = normalized;

      console.log('---- normalized', update);
      ctx.postMessage(update);
    });
  }
}
