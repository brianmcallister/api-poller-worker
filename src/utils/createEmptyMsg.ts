import { Msg } from '../types';

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
