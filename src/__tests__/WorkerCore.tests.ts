// @ts-ignore
global.self = global;

// eslint-disable-next-line import/first
import WorkerCore from '../WorkerCore';

jest.mock('../Poller', () =>
  jest.fn(() => ({
    start: jest.fn(() => ({ subscribe: jest.fn() })),
  })),
);

describe('WorkerCore', () => {
  describe('constructor', () => {
    it('create a records property', () => {
      const worker = new WorkerCore({ url: 'test' });

      // @ts-ignore
      expect(worker.records).toStrictEqual({
        ids: [],
        byId: {},
      });
    });

    // it('starts a poller and subscribes', () => {

    // });

    // it('saves normalized records on update', () => {
    // });

    // it('publishes a Msg on an update', () => {

    // });
  });

  describe('.normalize', () => {
    it('should normalize objects', () => {
      const data = [
        { id: 1, test: 'val1' },
        { id: 2, test: 'val2' },
      ];

      // @ts-ignore
      expect(WorkerCore.normalize(data, 'id')).toStrictEqual({
        ids: [1, 2],
        byId: {
          '1': {
            id: 1,
            test: 'val1',
          },
          '2': {
            id: 2,
            test: 'val2',
          },
        },
      });
    });
  });

  describe('.diff', () => {
    it('returns the correct response', () => {
      const stateA = {
        ids: [1, 2, 3],
        byId: {
          '1': { id: 1, test: 'value1' },
          '2': { id: 2, test: 'value2' },
          '3': { id: 3, test: 'value3' },
        },
      };
      const stateB = {
        ids: [2, 3, 4],
        byId: {
          '2': { id: 2, test: 'value2a' },
          '3': { id: 3, test: 'value3' },
          '4': { id: 4, test: 'value4' },
        },
      };

      // @ts-ignore
      expect(WorkerCore.diff(stateA, stateB, 'id')).toStrictEqual({
        newItems: {
          ids: [4],
          byId: {
            '4': { id: 4, test: 'value4' },
          },
        },
        removedItems: [1],
        updatedItems: {
          ids: [2],
          byId: {
            '2': { id: 2, test: 'value2a' },
          },
        },
      });
    });
  });
});
