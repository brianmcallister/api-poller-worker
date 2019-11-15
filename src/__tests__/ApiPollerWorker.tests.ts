import ApiPollerWorker from '../ApiPollerWorker';

describe('ApiPollerWorker', () => {
  describe('constructor', () => {
    it('should create a Worker instance', () => {
      const addEventListener = jest.fn();

      // @ts-ignore
      global.Worker = jest.fn(() => ({
        addEventListener,
      }));

      const worker = new ApiPollerWorker({ workerUrl: 'test url' });

      // @ts-ignore
      expect(global.Worker).toHaveBeenCalled();
      // @ts-ignore
      expect(global.Worker).toHaveBeenCalledWith('test url');
      expect(addEventListener).toHaveBeenCalled();
      expect(addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

      const [_, callback] = addEventListener.mock.calls[0];
      const mockListener = jest.fn();

      expect(_).toStrictEqual('message');

      // @ts-ignore
      worker.listeners.add(mockListener);

      callback({ data: 'test data' });

      expect(mockListener).toHaveBeenCalledWith('test data');
    });
  });

  describe('onMessage', () => {
    it('should add a callback to the listeners Set', () => {
      const worker = new ApiPollerWorker({ workerUrl: 'test url' });
      const callback = jest.fn();

      worker.onMessage(callback);

      // @ts-ignore
      expect(worker.listeners.size).toStrictEqual(1);

      // @ts-ignore
      expect([...worker.listeners.values()][0]).toStrictEqual(callback);
    });
  });
});
