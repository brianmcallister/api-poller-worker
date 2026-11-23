import { runInNewContext } from 'node:vm';

import inlineWorkerSource from 'inline-worker-source';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkerCore } from '../index';
import type { ControlMessage, WorkerMessage } from '../types';

type Listener = (event: MessageEvent<ControlMessage>) => void;

/** A stand-in for a worker's global scope. */
const createScope = () => {
  const listeners = new Set<Listener>();
  const posted: WorkerMessage<{ id: string; price: number }>[] = [];

  return {
    posted,
    addEventListener: (_: 'message', listener: Listener) => listeners.add(listener),
    removeEventListener: (_: 'message', listener: Listener) => listeners.delete(listener),
    postMessage: (message: WorkerMessage<{ id: string; price: number }>) => posted.push(message),
    send: (data: ControlMessage) => {
      for (const listener of [...listeners]) {
        listener({ data } as MessageEvent<ControlMessage>);
      }
    },
  };
};

const fetchMock = vi.fn<typeof fetch>();
const respondWith = (...bodies: unknown[]) => {
  for (const body of bodies) {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify(body))));
  }
};

beforeEach(() => {
  fetchMock.mockReset();
  // After the responses a test sets up, requests never finish, so each response is seen once.
  fetchMock.mockImplementation(() => new Promise<Response>(() => undefined));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WorkerCore', () => {
  it('sends what changed between responses', async () => {
    const scope = createScope();
    respondWith(
      [{ id: 'a', price: 1 }],
      [
        { id: 'a', price: 2 },
        { id: 'b', price: 3 },
      ],
    );
    new WorkerCore({ url: '/api', interval: 10 }, scope);

    scope.send({ type: 'start' });
    await vi.waitFor(() => {
      expect(scope.posted).toHaveLength(2);
    });
    scope.send({ type: 'stop' });

    expect(scope.posted[0]).toStrictEqual({
      type: 'update',
      msg: {
        newItems: { ids: ['a'], byId: { a: { id: 'a', price: 1 } } },
        updatedItems: { ids: [], byId: {} },
        removedItems: [],
      },
    });
    expect(scope.posted[1]).toMatchObject({
      type: 'update',
      msg: { newItems: { ids: ['b'] }, updatedItems: { ids: ['a'] } },
    });
  });

  it('sends an error when an object has no unique key', async () => {
    const scope = createScope();
    respondWith([{ name: 'no id' }]);
    new WorkerCore({ url: '/api' }, scope);

    scope.send({ type: 'start' });
    await vi.waitFor(() => {
      expect(scope.posted).toHaveLength(1);
    });
    scope.send({ type: 'stop' });

    expect(scope.posted[0]).toStrictEqual({
      type: 'error',
      message: 'Resource does not have a property named "id"',
    });
  });

  // Regression: WorkerCore used to read `self` when the module loaded, which threw outside a worker.
  it('can be imported outside a worker', async () => {
    expect('self' in globalThis).toBe(false);
    await expect(import('../index')).resolves.toHaveProperty('ApiPollerWorker');
  });
});

// Regression: the published package shipped the inline worker as a module instead of a string, so
// inline mode threw. This runs the same generated source that the package embeds.
describe('the inline worker', () => {
  it('is a self-contained script', () => {
    expect(typeof inlineWorkerSource).toBe('string');
    expect(inlineWorkerSource).not.toMatch(/\brequire\(|\bimport\b/);
  });

  it('polls with the options from its init message', async () => {
    const scope = createScope();
    respondWith([{ id: 'a', price: 1 }]);
    runInNewContext(inlineWorkerSource, {
      ...scope,
      fetch: fetchMock,
      Response,
      setInterval,
      clearInterval,
      JSON,
      Object,
      Error,
      Set,
      Array,
    });

    scope.send({
      type: 'init',
      options: { url: 'https://example.com/items', interval: 50, fetchOptions: { method: 'GET' } },
    });
    scope.send({ type: 'start' });
    await vi.waitFor(() => {
      expect(scope.posted).toHaveLength(1);
    });
    scope.send({ type: 'stop' });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/items', { method: 'GET' });
    expect(scope.posted[0]).toMatchObject({ type: 'update', msg: { newItems: { ids: ['a'] } } });
  });
});
