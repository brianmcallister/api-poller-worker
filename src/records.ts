import type { Msg, Records } from './types';

/**
 * Create a `Msg` with nothing in it.
 */
export const createEmptyMsg = <T>(): Msg<T> => ({
  newItems: { ids: [], byId: {} },
  updatedItems: { ids: [], byId: {} },
  removedItems: [],
});

/**
 * Key an array of objects by `uniqueKey`.
 */
export const normalize = <T extends object>(data: readonly T[], uniqueKey: string): Records<T> => {
  const records: Records<T> = { ids: [], byId: {} };

  for (const datum of data) {
    if (!Object.prototype.hasOwnProperty.call(datum, uniqueKey)) {
      throw new Error(`Resource does not have a property named "${uniqueKey}"`);
    }

    // IDs are always strings, so they match the keys of `byId`, even when the API uses numbers.
    const id = String((datum as Record<string, unknown>)[uniqueKey]);

    records.ids.push(id);
    records.byId[id] = datum;
  }

  return records;
};

/**
 * Work out which objects are new, updated and removed between two sets of records.
 */
export const diff = <T>(before: Records<T>, after: Records<T>): Msg<T> => {
  const beforeIds = new Set(before.ids);
  const afterIds = new Set(after.ids);
  const msg = createEmptyMsg<T>();

  for (const id of after.ids) {
    const item = after.byId[id] as T;

    if (!beforeIds.has(id)) {
      msg.newItems.ids.push(id);
      msg.newItems.byId[id] = item;
    } else if (JSON.stringify(before.byId[id]) !== JSON.stringify(item)) {
      msg.updatedItems.ids.push(id);
      msg.updatedItems.byId[id] = item;
    }
  }

  msg.removedItems = before.ids.filter((id) => !afterIds.has(id));

  return msg;
};
