import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiPollerWorker, type Msg, type WorkerMessage } from '../index';

/** A stand-in for the browser's Worker. */
class FakeWorker {
  static instances: FakeWorker[] = [];

  readonly url: string | URL;

  readonly sent: unknown[] = [];

  terminated = false;

  private listener: ((event: MessageEvent) => void) | undefined;

  constructor(url: string | URL) {
    this.url = url;
    FakeWorker.instances.push(this);
  }

  addEventListener(_: 'message', listener: (event: MessageEvent) => void) {
    this.listener = listener;
  }

  postMessage(message: unknown) {
    this.sent.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  receive(data: WorkerMessage<{ id: string }>) {
    this.listener?.({ data } as MessageEvent);
  }
}

const lastWorker = () => FakeWorker.instances[FakeWorker.instances.length - 1] as FakeWorker;

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal('Worker', FakeWorker);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ApiPollerWorker', () => {
  it('creates a worker from workerUrl and starts it', () => {
    new ApiPollerWorker({ workerUrl: '/poller.js' });

    expect(lastWorker().url).toBe('/poller.js');
    expect(lastWorker().sent).toStrictEqual([{ type: 'start' }]);
  });

  it('uses a worker you created', () => {
    const worker = new FakeWorker('/mine.js');
    new ApiPollerWorker({ worker: worker as unknown as Worker });

    expect(FakeWorker.instances).toStrictEqual([worker]);
    expect(worker.sent).toStrictEqual([{ type: 'start' }]);
  });

  it('creates the inline worker and sends it its options before starting', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:inline');

    new ApiPollerWorker({ inline: true, apiUrl: 'https://example.com/items', interval: 500 });

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(lastWorker().url).toBe('blob:inline');
    expect(lastWorker().sent).toStrictEqual([
      {
        type: 'init',
        options: {
          url: 'https://example.com/items',
          interval: 500,
          fetchOptions: undefined,
          uniqueKey: undefined,
        },
      },
      { type: 'start' },
    ]);
  });

  it('embeds the inline worker source in the blob', async () => {
    let blob: Blob | undefined;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
      blob = value as Blob;

      return 'blob:inline';
    });

    new ApiPollerWorker({ inline: true, apiUrl: '/api' });

    expect(blob?.type).toBe('text/javascript');
    expect(await blob?.text()).toContain('init');
  });

  it.each([
    ['inline without an apiUrl', { inline: true }],
    ['no worker at all', {}],
  ])('throws for %s', (_, options) => {
    expect(() => new ApiPollerWorker(options)).toThrow('[ApiPollerWorker]');
  });

  it("doesn't start until asked when autoStart is false", () => {
    const poller = new ApiPollerWorker({ workerUrl: '/poller.js', autoStart: false });
    expect(lastWorker().sent).toStrictEqual([]);

    poller.start().start();
    poller.stop().stop();
    poller.start();

    expect(lastWorker().sent).toStrictEqual([
      { type: 'start' },
      { type: 'stop' },
      { type: 'start' },
    ]);
  });

  it('passes updates to onMessage and errors to onError', () => {
    const poller = new ApiPollerWorker<{ id: string }>({ workerUrl: '/poller.js' });
    const onMessage = vi.fn<(msg: Msg<{ id: string }>) => void>();
    const onError = vi.fn<(error: Error) => void>();
    poller.onMessage(onMessage).onError(onError);

    const msg: Msg<{ id: string }> = {
      newItems: { ids: ['a'], byId: { a: { id: 'a' } } },
      updatedItems: { ids: [], byId: {} },
      removedItems: [],
    };
    lastWorker().receive({ type: 'update', msg });
    lastWorker().receive({ type: 'error', message: 'Request failed with status 500' });

    expect(onMessage).toHaveBeenCalledWith(msg);
    expect(onError).toHaveBeenCalledWith(new Error('Request failed with status 500'));
  });

  it('terminates the worker and releases the inline source', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:inline');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    new ApiPollerWorker({ inline: true, apiUrl: '/api' }).terminate();

    expect(lastWorker().terminated).toBe(true);
    expect(revoke).toHaveBeenCalledWith('blob:inline');
  });
});
