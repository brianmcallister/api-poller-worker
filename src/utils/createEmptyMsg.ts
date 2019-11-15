import { Msg } from '../types';

/**
 * Create an empty `Msg`.
 */
export default function createEmptyMsg<T extends {}>(): Msg<T> {
  return {
    newItems: {
      ids: [],
      byId: {},
    },
    updatedItems: {
      ids: [],
      byId: {},
    },
    removedItems: [],
  };
}
