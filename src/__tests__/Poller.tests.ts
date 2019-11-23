import Poller from '../Poller';

jest.useFakeTimers();

// @ts-ignore
global.fetch = jest.fn(() => ({
  json: jest.fn(() => 'test json'),
}));

describe('Poller', () => {
  describe('constructor', () => {
    it('should assign the correct properties', () => {
      const opts = { url: 'test' };
      const poller = new Poller(opts);

      // @ts-ignore
      expect(poller.options).toBe(opts);
      // @ts-ignore
      expect(poller.interval).toBe(2000);
      // @ts-ignore
      expect(poller.listeners).toStrictEqual(expect.any(Set));
    });
  });

  describe('start', () => {
    it('should make an initial request', () => {
      const poller = new Poller({ url: 'test' });

      // @ts-ignore
      poller.makeRequest = jest.fn();

      poller.start();

      // @ts-ignore
      expect(poller.makeRequest).toHaveBeenCalledWith();
      // @ts-ignore
      expect(poller.intervalId).toStrictEqual(1);
    });

    it('should clear any previous intervals by calling stop', () => {
      const poller = new Poller({ url: 'test' });

      const spy = jest.spyOn(poller, 'stop');

      poller.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should start an interval', () => {
      // @ts-ignore
      setInterval.mockClear();

      const poller = new Poller({ url: 'test' });

      // @ts-ignore
      poller.makeRequest = jest.fn();

      poller.start();

      // @ts-ignore
      expect(setInterval).toHaveBeenCalledWith(poller.makeRequest, 2000);
    });

    it('should return the Poller instance', () => {
      const poller = new Poller({ url: 'test' });

      // @ts-ignore
      poller.makeRequest = jest.fn();

      const returnValue = poller.start();

      expect(returnValue).toBe(poller);
    });
  });

  describe('stop', () => {
    it('should clear the interval if it exists', () => {
      const poller = new Poller({ url: 'test' });

      // @ts-ignore
      poller.intervalId = null;
      poller.stop();

      expect(clearInterval).not.toHaveBeenCalled();

      // @ts-ignore
      poller.intervalId = 'test';
      poller.stop();

      expect(clearInterval).toHaveBeenCalledWith('test');
    });

    it('should return the Poller instance', () => {
      const poller = new Poller({ url: 'test' });
      const returnValue = poller.stop();

      expect(returnValue).toBe(poller);
    });
  });

  describe('subscribe', () => {
    it('should add an event listener', () => {
      const poller = new Poller({ url: 'test' });
      const mock = jest.fn();

      poller.subscribe(mock);

      // @ts-ignore
      expect(poller.listeners.size).toBe(1);
      // @ts-ignore
      expect([...poller.listeners.values()][0]).toStrictEqual(mock);
    });

    it('should return the Poller instance', () => {
      const poller = new Poller({ url: 'test' });
      const returnValue = poller.subscribe(jest.fn());

      expect(returnValue).toBe(poller);
    });
  });

  describe('makeRequest', () => {
    it('should return a promise', () => {
      const poller = new Poller({ url: 'test' });

      // @ts-ignore
      const val = poller.makeRequest();

      expect(val).toStrictEqual(expect.any(Promise));
    });

    it('should do nothing if theres a pending request', () => {
      // @ts-ignore
      fetch.mockClear();

      const poller = new Poller({ url: 'test' });

      // @ts-ignore
      poller.requestPending = true;

      // @ts-ignore
      poller.makeRequest();

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should make a request and call listeners', () => {
      // @ts-ignore
      fetch.mockClear();

      const poller = new Poller({ url: 'test' });
      const mockCallback = jest.fn();

      poller.subscribe(mockCallback);

      /* eslint-disable promise/catch-or-return, promise/always-return, promise/no-callback-in-promise */
      // @ts-ignore
      return poller.makeRequest().then(() => {
        expect(fetch).toHaveBeenCalledWith('test', undefined);
        expect(mockCallback).toHaveBeenCalledWith('test json');
        // @ts-ignore
        expect(poller.requestPending).toBe(false);
      });
      /* eslint-enable */
    });

    it('should pass through fetchOptions from the constructor', async () => {
      // @ts-ignore
      fetch.mockClear();

      const poller = new Poller({ url: 'test', fetchOptions: { method: 'post' } });

      // @ts-ignore
      await poller.makeRequest();

      expect(fetch).toHaveBeenCalledWith('test', { method: 'post' });
    });

    it('should log errors', async () => {
      // @ts-ignore
      fetch.mockClear();

      const poller = new Poller({ url: 'test' });
      const mockCallback = jest.fn(() => {
        throw new Error('err');
      });

      poller.subscribe(mockCallback);

      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // @ts-ignore
      await poller.makeRequest();

      expect(spy).toHaveBeenCalledWith(expect.any(Error));

      spy.mockRestore();
    });
  });
});
