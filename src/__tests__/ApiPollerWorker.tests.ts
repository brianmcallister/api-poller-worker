import ApiPollerWorker from '../ApiPollerWorker';

describe('ApiPollerWorker', () => {
  const addEventListener = jest.fn().mockName('addEventListener');
  const postMessage = jest.fn().mockName('postMessage');

  beforeEach(() => {
    // @ts-ignore
    global.Worker = jest.fn(() => ({
      addEventListener,
      postMessage,
    }));

    addEventListener.mockClear();
    postMessage.mockClear();
  });

  describe('constructor', () => {
    it('should create a Worker instance', () => {
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

    it('should automatically start polling', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const worker = new ApiPollerWorker({ workerUrl: 'test url' });

      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith({ type: 'start' });
    });
  });

  describe('.start', () => {
    it('should send a message to start polling', () => {
      const worker = new ApiPollerWorker({ autoStart: false, workerUrl: 'test url' });

      worker.start();

      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith({ type: 'start' });
    });

    it('should not send duplicate messages', () => {
      const worker = new ApiPollerWorker({ autoStart: false, workerUrl: 'test url' });

      worker.start();
      worker.start();

      expect(postMessage).toHaveBeenCalledTimes(1);
    });

    it('should return `this`', () => {
      const worker = new ApiPollerWorker({ workerUrl: 'test url' });

      expect(worker.start()).toStrictEqual(worker);
    });
  });

  describe('.stop', () => {
    it('should send a message to start polling', () => {
      const worker = new ApiPollerWorker({ workerUrl: 'test url' });

      // Clear because of the `autoStart` option.
      postMessage.mockClear();
      worker.stop();

      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith({ type: 'stop' });
    });

    it('should not send duplicate messages', () => {
      const worker = new ApiPollerWorker({ workerUrl: 'test url' });

      // Clear because of the `autoStart` option.
      postMessage.mockClear();
      worker.stop();
      worker.stop();

      expect(postMessage).toHaveBeenCalledTimes(1);
    });

    it('should return `this`', () => {
      const worker = new ApiPollerWorker({ workerUrl: 'test url' });

      expect(worker.stop()).toStrictEqual(worker);
    });
  });

  describe('.onMessage', () => {
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
