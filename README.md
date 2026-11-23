# api-poller-worker

[![CI](https://github.com/brianmcallister/api-poller-worker/actions/workflows/ci.yml/badge.svg)](https://github.com/brianmcallister/api-poller-worker/actions/workflows/ci.yml) [![npm version](https://img.shields.io/npm/v/api-poller-worker?label=version&color=%2354C536&logo=npm)](https://www.npmjs.com/package/api-poller-worker)

> Efficient polling with web workers. Make existing APIs feel real time

`api-poller-worker` turns regular 'ol RESTful JSON APIs into realtime streaming connections (not really), using polling with web workers. A worker polls the API and compares each response with the last, so your page only hears about what's new, updated or removed.

## Table of contents

- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
  - [Inline worker](#inline-worker)
  - [Your own worker](#your-own-worker)
  - [What the API needs to return](#what-the-api-needs-to-return)
- [API](#api)
  - [`ApiPollerWorker`](#apipollerworker)
  - [`WorkerCore`](#workercore)
  - [`createEmptyMsg`](#createemptymsg)
  - [Types](#types)
- [Upgrading from 1.x](#upgrading-from-1x)

## Demo

Hosted demo: [https://brianmcallister.github.io/api-poller-worker/](https://brianmcallister.github.io/api-poller-worker/)

The demo uses the package built from this repository, so build it before running the demo locally:

```sh
git clone git@github.com:brianmcallister/api-poller-worker.git
cd api-poller-worker
npm install
npm run build
cd demo
npm install
npm start
```

###### [⇡ Top](#table-of-contents)

## Installation

```sh
npm install api-poller-worker
```

###### [⇡ Top](#table-of-contents)

## Usage

There are two ways to use this library. The inline worker is the easiest. Your own worker lets you do more with the data inside the worker, such as making other requests or expensive calculations, before it reaches your page.

### Inline worker

The package includes a worker, so there's nothing else to set up:

```ts
import { ApiPollerWorker } from 'api-poller-worker';

const poller = new ApiPollerWorker<Product>({
  inline: true,
  apiUrl: 'https://example.com/api/products',
  interval: 5000,
});

poller.onMessage((msg) => {
  console.log('new', msg.newItems, 'updated', msg.updatedItems, 'removed', msg.removedItems);
});

poller.onError((error) => {
  console.error('Polling failed', error);
});
```

### Your own worker

Create a `WorkerCore` in your worker script:

> `poller.worker.ts`

```ts
import { WorkerCore } from 'api-poller-worker';

new WorkerCore<Product>({ url: 'https://example.com/api/products' });
```

Then pass the worker to `ApiPollerWorker`. With a bundler such as Vite or webpack 5, create it with `new Worker(new URL(...))` so the bundler builds the worker for you:

```ts
import { ApiPollerWorker } from 'api-poller-worker';

const poller = new ApiPollerWorker<Product>({
  worker: new Worker(new URL('./poller.worker.ts', import.meta.url), { type: 'module' }),
});
```

If your worker is already built, pass its URL with `workerUrl` instead.

### What the API needs to return

The API endpoint has to respond with a JSON array of objects, each with a unique ID. The ID property defaults to `id`, and you can change it with `uniqueKey`.

```json
[
  { "id": 1, "some": "value" },
  { "id": 2, "some": "other value" }
]
```

A response that isn't successful, or isn't an array, is reported to `onError` instead of `onMessage`.

###### [⇡ Top](#table-of-contents)

## API

### `ApiPollerWorker`

```ts
import { ApiPollerWorker } from 'api-poller-worker';

new ApiPollerWorker<T>(options: ApiPollerWorkerOptions);
```

Runs a worker that polls an API, and tells you what changed in each response. `T` is the type of the objects the API returns. See [`ApiPollerWorkerOptions`](#apipollerworkeroptions).

- `start(): this` starts polling. Polling starts right away unless `autoStart` is `false`.
- `stop(): this` stops polling. Call `start` to poll again.
- `onMessage(callback: (msg: Msg<T>) => void): this` calls `callback` with what changed after each response. See [`Msg<T>`](#msgt).
- `onError(callback: (error: Error) => void): this` calls `callback` when a request fails, the response isn't an array, or an object has no unique ID.
- `terminate(): void` stops polling and shuts the worker down for good.

### `WorkerCore`

```ts
import { WorkerCore } from 'api-poller-worker';

new WorkerCore<T>(options: WorkerCoreOptions);
```

Polls the API from inside your own worker. Create one in your worker script, and control it from the page with `ApiPollerWorker`. See [`WorkerCoreOptions`](#workercoreoptions).

### `createEmptyMsg`

```ts
import { createEmptyMsg } from 'api-poller-worker';

createEmptyMsg<T>(): Msg<T>;
```

Creates a [`Msg<T>`](#msgt) with nothing in it. Useful as initial state.

### Types

#### `ApiPollerWorkerOptions`

```ts
interface ApiPollerWorkerOptions {
  // Use the worker built into this package to poll `apiUrl`.
  inline?: boolean;
  // The API endpoint to poll, when `inline` is set.
  apiUrl?: string;
  // Options passed to `fetch`, when `inline` is set. Use a plain `headers` object.
  fetchOptions?: RequestInit;
  // How often to poll, in milliseconds, when `inline` is set. Defaults to 2000.
  interval?: number;
  // The property that uniquely identifies each object, when `inline` is set. Defaults to 'id'.
  uniqueKey?: string;
  // Your own worker, which creates a `WorkerCore`.
  worker?: Worker;
  // The URL of your own worker script, which creates a `WorkerCore`.
  workerUrl?: string | URL;
  // Start polling right away. Defaults to true.
  autoStart?: boolean;
}
```

#### `WorkerCoreOptions`

```ts
interface WorkerCoreOptions {
  // The API endpoint to poll.
  url: string;
  // Options passed to `fetch`.
  fetchOptions?: RequestInit;
  // How often to poll, in milliseconds. Defaults to 2000.
  interval?: number;
  // The property that uniquely identifies each object. Defaults to 'id'.
  uniqueKey?: string;
}
```

#### `Msg<T>`

What changed between two responses.

```ts
interface Msg<T> {
  newItems: Records<T>;
  updatedItems: Records<T>;
  removedItems: string[];
}
```

#### `Records<T>`

Objects keyed by their unique ID. IDs are always strings, even when the API uses numbers.

```ts
interface Records<T> {
  ids: string[];
  byId: Record<string, T>;
}
```

###### [⇡ Top](#table-of-contents)

## Upgrading from 1.x

- Inline mode works. In 1.x the published package didn't include the inline worker it needed, so `inline: true` threw.
- The worker now sends `{ type: 'update', msg }` and `{ type: 'error', message }` messages, which `ApiPollerWorker` unpacks for you. If you use your own worker, make sure the page and the worker use the same version of this package.
- IDs in `Msg` and `Records` are always strings.
- The package has an `exports` map, so deep imports from `dist/` no longer work.

See the [changelog](CHANGELOG.md) for everything else.

###### [⇡ Top](#table-of-contents)
