import Poller from './Poller';

import { Records, Msg } from './types';

interface WorkerCoreOptions {
  fetchOptions?: RequestInit;
  interval?: number;
  uniqueKey?: string;
  url: string;
}

type IncomingMessage = { data: { type: 'start' } } | { data: { type: 'stop' } };

// Set up a global object for WebWorkers.
// See: https://github.com/Microsoft/TypeScript/issues/20595#issuecomment-390359040
// eslint-disable-next-line no-restricted-globals, @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;

/**
 * WorkerCore class.
 * @class
 *
 * Acceps a generic, `T`, which represents the type
 * of data returned by the polled endpoint.
 */
export default class WorkerCore<T> {
  // Current set of records.
  private records: Records<T>;

  // Keep track of the poller instance.
  private poller: Poller<T>;

  /**
   * Constructor.
   * @constructor
   */
  constructor(options: WorkerCoreOptions) {
    const { url, uniqueKey = 'id', interval = 2000, fetchOptions } = options;

    this.poller = new Poller<T>({ url, interval, fetchOptions });
    this.records = {
      ids: [],
      byId: {},
    };

    // Handle incoming messages.
    ctx.addEventListener('message', message => {
      const { data }: IncomingMessage = message;

      switch (data.type) {
        case 'start': {
          this.poller.start();
          break;
        }
        case 'stop': {
          this.poller.stop();
          break;
        }
        default:
          break;
      }
    });

    // Subscribe to data from the Poller instance.
    this.poller.subscribe(data => {
      const normalized = WorkerCore.normalize(data, uniqueKey);
      const update = WorkerCore.diff(this.records, normalized, uniqueKey);

      this.records = normalized;

      ctx.postMessage(update);
    });
  }

  /**
   * Normalize an array of resources (`T[]`) into a `Records<T>`.
   * @static
   * @private
   */
  private static normalize<T extends {}>(data: T[], uniqueKey: string): Records<T> {
    const ids: string[] = [];
    const byId: { [id: string]: T } = {};

    data.forEach((datum: T) => {
      if (!Object.prototype.hasOwnProperty.call(datum, uniqueKey)) {
        // Don't do a template string here because it interfers with the
        // inlined worker. This file will become a giant string in the
        // compiled version and the template string syntax creates problems.
        // eslint-disable-next-line prefer-template
        throw new Error('Resource does not have key named: ' + uniqueKey);
      }

      // At this point, we have no idea what `T` is going to be,
      // beyond it being some kind of object, so we need to rely on
      // runtime checks to make sure the unique key actually exists
      // on this object.
      // @ts-ignore
      const id: string = datum[uniqueKey];

      ids.push(id);
      byId[id] = datum;
    });

    return { ids, byId };
  }

  /**
   * Diff normalized data.
   * @static
   * @private
   *
   * Take two complete sets of data (`Records<T>`), and figure out
   * which items are new, updated, and deleted.
   */
  private static diff<T extends {}>(
    before: Records<T>,
    after: Records<T>,
    uniqueKey: string,
  ): Msg<T> {
    const { ids: beforeIds } = before;
    const { ids: afterIds } = after;

    // Get the set of IDs that are in `after`, but not in `before`.
    const newIds = afterIds.filter(id => !beforeIds.includes(id));
    const newItems = WorkerCore.normalize<T>(
      newIds.map(id => after.byId[id]),
      uniqueKey,
    );

    // Get the set of IDs that are in `before`, but not in `after`.
    const removedIds = beforeIds.filter(id => !afterIds.includes(id));

    const updatedItems: Records<T> = {
      ids: [],
      byId: {},
    };

    // Compare all before and after objects to see which ones have updated.
    afterIds.forEach(afterId => {
      const beforeObj = before.byId[afterId];
      const afterObj = after.byId[afterId];

      if (!beforeObj) {
        return;
      }

      if (JSON.stringify(beforeObj) !== JSON.stringify(afterObj)) {
        updatedItems.ids.push(afterId);
        updatedItems.byId[afterId] = afterObj;
      }
    });

    return {
      newItems,
      removedItems: removedIds,
      updatedItems,
    };
  }
}
