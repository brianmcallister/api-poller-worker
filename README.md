# @brianmcallister/api-poller-worker

[![codecov](https://codecov.io/gh/brianmcallister/api-poller-worker/branch/master/graph/badge.svg)](https://codecov.io/gh/brianmcallister/api-poller-worker) [![CircleCI](https://circleci.com/gh/brianmcallister/api-poller-worker.svg?style=svg)](https://circleci.com/gh/brianmcallister/api-poller-worker) [![npm version](https://img.shields.io/npm/v/@brianmcallister/api-poller-worker?label=version&color=%2354C536&logo=npm)](https://www.npmjs.com/package/@brianmcallister/api-poller-worker)

> Efficient polling with WebWorkers. Make existing APIs feel real time

`api-poller-worker` turns regular 'ol RESTful JSON APIs into realtime streaming connections (not really), using polling with web workers.

## Table of contents

- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - Classes
    - [`ApiPollerWorker`](#apipollerworker)
      - [`#start`](#apipollerworkerstart)
      - [`#stop`](#apipollerworkerstop)
      - [`#onMessage`](#apipollerworkeronmessage)
    - [`WorkerCore`](#workercore)
  - Utils
    - [`createEmptyMsg`](#createemptymsg)
  - Types
    - [`Records<T>`](#recordst)
    - [`Msg<T>`](#msgt)
    - [`ApiPollerWorkerOptions`](#apipollerworkeroptions)

## Demo

Hosted demo: [https://api-poller-worker.netlify.com/](https://api-poller-worker.netlify.com/)

You can also run the demo locally. To get started:

```sh
git clone git@github.com:brianmcallister/api-poller-worker.git
cd api-poller-worker/demo
npm i
npm start
```

###### [⇡ Top](#table-of-contents)

## Installation

```sh
npm install @brianmcallister/api-poller-worker
```

###### [⇡ Top](#table-of-contents)

## Usage

### How to get started

There are two ways to use this library:

1. Set `inline` to `true` when creating an `ApiPollerWorker`. Doing this will create an [inline worker](https://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers). Although this is much easier than option 2, if you need fine grained control over what's going on inside the worker (such as making other XHR requests, doing expensive calculations based on the data returned by the API that you're polling, etc.), you'll want to try...
2. Provide a URL to a worker file. Within that worker file, you need to create an instance of `WorkerCore`. If you do this, you now have the ability to manipulate the data from the API endpoint before you pass it back to your application. You also have the ability to pass more fine grained options to the `WorkerCore` class.

#### Option 1: Inline worker

Here's an example of how to create an inline worker:

```ts
const worker = ApiPollerWorker({ inline: true, apiUrl: '<my api url>' });

worker.onMessage(data => console.log(data));
```

#### Option 2: Create your own Worker.

There are two distinct steps to getting this working:

1. Create an [`ApiPollerWorker`](#apipollerworker) instance in your application, and subscribe to updates.
2. Create a web worker, and create a [`WorkerCore`](#workercore) instance inside of it.

What this library does _not_ help with is creating the worker files themselves. You'll have to set this up in your application's build pipeline, but there are many resources available online to guide you. You can also check out the demo application source to see how I like to set it up.

- [Worker documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Worker)
- [`worker-loader`, a webpack plugin](https://github.com/webpack-contrib/worker-loader)
- [Demo application source](https://github.com/brianmcallister/api-poller-worker/tree/master/demo)

In short, you need to tell your [`ApiPollerWorker`](#apipollerworker) where your worker is, and then in your worker, you need to tell [`WorkerCore`](#workercore) where the API endpoint you'd like to poll is.

The reason for structuring the code this way is so that you can do other operations on the data from your polled API endpoint _in your worker_, before passing the data back to your application.

### Assumptions

Internally, there are some assumptions being made about the API that is being polled. Specifically that the API endpoint responds with JSON, as a list of objects with a unique identifier.

Which key is used as the unique identifier is configurable (see [`WorkerCore`](#workercore)), but there does need to be one. As long as your endpoint responds with something like this, everything should work just fine:

```json
[
  {
    "id": 1,
    "some": "value"
  },
  {
    "id": 2,
    "some": "other value"
  }
]
```

###### [⇡ Top](#table-of-contents)

## API

### Classes

#### `ApiPollerWorker`

```ts
import { ApiPollerWorker } from '@brianmcallister/api-poller-worker';
```

The `ApiPollerWorker` class is what coordinates the communcation between
your app and your worker. The constructor accepts the following:

```ts
interface ApiPollerWorkerOptions {
  // URL of the API endpoint to poll. This is only required
  // if inline is true.
  apiUrl?: string;
  // Tell the worker to start polling immediately.
  // Defaults to true.
  autoStart?: boolean;
  // Create an inline worker.
  // Defaults to false.
  inline?: boolean;
  // URL of the Worker to be created.
  // This option is required if inline is false.
  workerUrl?: string;
}
```

##### `ApiPollerWorker#start`

Send a message (via `postMessage`) to the worker, telling it to start polling.

```ts
const pollerWorker = new ApiPollerWorker<Resource>({
  workerUrl: '/my-worker-file.js',
});

pollerWorker.start();
```

##### `ApiPollerWorker#stop`

Send a message (via `postMessage`) to the worker, telling it to stop polling.

```ts
const pollerWorker = new ApiPollerWorker<Resource>({
  workerUrl: '/my-worker-file.js',
});

pollerWorker.stop();
```

##### `ApiPollerWorker#onMessage`

Subscribe to updates from the `ApiPollerWorker` instance. The response is a [`Msg<T>`](#msgt), which is structured so that your application will know exactly which resources in your polled endpoint are new, updated, or removed.

```ts
const pollerWorker = new ApiPollerWorker<Resource>({
  workerUrl: '/my-worker-file.js',
});

pollerWorker.onMessage(data => {
  // `data` will be of type Msg<Resource>
  console.log('got data', data);
});
```

###### [⇡ Top](#table-of-contents)

#### `WorkerCore`

```ts
import { WorkerCore } from '@brianmcallister/api-poller-worker';
```

The `WorkerCore` class is the what you need to create an instance of in your Worker. The constructor accepts the following options:

```ts
interface WorkerCoreOptions {
  // URL to poll.
  url: string;
  // Unique key for the resources returned by the API.
  // Defaults to 'id'.
  uniqueKey?: string;
  // How often the API endpoint should be polled,
  // in milliseconds.
  // Defaults to 2000.
  interval?: number;
}
```

Here's an example of the simplest possible Worker file (with type safety).

> `worker.ts`

```ts
import { WorkerCore } from '@brianmcallister/api-poller-worker';

import { Resource } from '../src/types';

new WorkerCore<Resource>({ url: '<some endpoint>' });
```

###### [⇡ Top](#table-of-contents)

### Utils

#### `createEmptyMsg`

Create the [`Msg<T>`](#msgt) structure, but empty. Useful for building default state for a slice of Redux state.

```ts
import { createEmptyMsg } from '@brianmcallister/api-poller-worker';
```

```ts
function createEmptyMsg<T>(): Msg<T>
```

###### [⇡ Top](#table-of-contents)

### Types

#### `Records<T>`

Keep track of a normalized set of records.

```ts
import { Records } from '@brianmcallister/api-poller-worker';
```

```ts
interface Records<T> {
  ids: string[];
  byId: { [id: string]: T };
}
```

###### [⇡ Top](#table-of-contents)

#### `Msg<T>`

Represents the contents of the message emitted by the [`WorkerCore`](#workercore).

```ts
import { Msg } from '@brianmcallister/api-poller-worker';
```

```ts
interface Msg<T> {
  newItems: Records<T>;
  updatedItems: Records<T>;
  removedItems: string[];
}
```

###### [⇡ Top](#table-of-contents)

#### `ApiPollerWorkerOptions`

Options object accepted by [`ApiPollerWorker`](#apipollerworker).

```ts
import { ApiPollerWorkerOptions } from '@brianmcallister/api-poller-worker';
```

```ts
interface ApiPollerWorkerOptions {
  apiUrl?: string;
  autoStart?: boolean;
  inline?: boolean;
  workerUrl?: string;
}
```

###### [⇡ Top](#table-of-contents)
