// @ts-ignore
global.self = global;
// @ts-ignore
global.self.addEventListener = jest.fn().mockName('addEventListener');
// @ts-ignore
global.self.postMessage = jest.fn().mockName('postMessage');

// eslint-disable-next-line import/first
import WorkerCore from '../WorkerCore';

jest.mock('../Poller', () =>
  jest.fn(() => {
    const subscribe = jest.fn().mockName('subscribe');

    return {
      start: jest.fn(() => ({ subscribe })),
      stop: jest.fn(() => ({ subscribe })),
      subscribe,
    };
  }),
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

    it('listens for message events', () => {
      const worker = new WorkerCore({ url: 'test' });

      // @ts-ignore
      expect(global.addEventListener).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(global.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

      // @ts-ignore
      const fn = global.addEventListener.mock.calls[0][1];

      fn({ data: { type: 'start' } });

      // @ts-ignore
      expect(worker.poller.start).toHaveBeenCalledTimes(1);

      fn({ data: { type: 'stop' } });

      // @ts-ignore
      expect(worker.poller.stop).toHaveBeenCalledTimes(1);
    });

    it('creates a poller and subscribes', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const worker = new WorkerCore({ url: 'test' });

      // @ts-ignore
      expect(worker.poller.subscribe).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(worker.poller.subscribe).toHaveBeenCalledWith(expect.any(Function));

      // @ts-ignore
      const fn = worker.poller.subscribe.mock.calls[0][0];

      fn([{ id: 1, test: 'value' }]);

      // @ts-ignore
      expect(global.self.postMessage).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(global.self.postMessage).toHaveBeenCalledWith({
        newItems: { byId: { '1': { id: 1, test: 'value' } }, ids: [1] },
        removedItems: [],
        updatedItems: { byId: {}, ids: [] },
      });
    });
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

    it('should throw an error if a unique key isnt found', () => {
      const data = [
        { id: 1, test: 'val1' },
        { id: 2, test: 'val2' },
      ];

      expect(() => {
        // @ts-ignore
        WorkerCore.normalize(data, '_id');
      }).toThrowError();
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
