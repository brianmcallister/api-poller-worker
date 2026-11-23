import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Poller } from '../Poller';

const respond = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('Poller', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('requests right away, then on every interval', async () => {
    fetchMock.mockImplementation(() => respond([]));
    const poller = new Poller({ url: '/api', interval: 1000 }).start();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    poller.stop();
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('passes the url and fetch options to fetch', () => {
    fetchMock.mockImplementation(() => respond([]));
    new Poller({ url: '/api', fetchOptions: { headers: { a: 'b' } } }).start().stop();

    expect(fetchMock).toHaveBeenCalledWith('/api', { headers: { a: 'b' } });
  });

  it('sends each response to subscribers', async () => {
    fetchMock.mockImplementation(() => respond([{ id: 1 }]));
    const listener = vi.fn();
    new Poller({ url: '/api' }).subscribe(listener).start().stop();

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledWith([{ id: 1 }]);
    });
  });

  it("doesn't stack up requests when the API is slow", async () => {
    let resolve: (response: Response) => void = () => undefined;
    fetchMock.mockImplementation(() => new Promise((r) => (resolve = r)));
    const poller = new Poller({ url: '/api', interval: 100 }).start();

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolve(new Response('[]'));
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    poller.stop();
  });

  // Regression: an error response used to be parsed and passed along as data.
  it.each([
    ['a failed request', () => respond({ error: 'nope' }, 500), 'Request failed with status 500'],
    [
      'a response that is not an array',
      () => respond({ items: [] }),
      'Expected the API to respond',
    ],
    ['a network error', () => Promise.reject(new TypeError('Failed to fetch')), 'Failed to fetch'],
  ])('reports %s as an error, not data', async (_, response, message) => {
    fetchMock.mockImplementation(response);
    const listener = vi.fn();
    const errorListener = vi.fn();
    new Poller({ url: '/api' }).subscribe(listener).onError(errorListener).start().stop();

    await vi.waitFor(() => {
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining(message) as string }),
      );
    });
    expect(listener).not.toHaveBeenCalled();
  });
});
