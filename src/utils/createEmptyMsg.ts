import { Msg } from '../types';

/**
 * Create an empty `Msg`.
 */
function createEmptyMsg<T extends {}>(): Msg<T> {
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

export default createEmptyMsg;
