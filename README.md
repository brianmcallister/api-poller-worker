# @brianmcallister/api-poller-worker

[![codecov](https://codecov.io/gh/brianmcallister/api-poller-worker/branch/master/graph/badge.svg)](https://codecov.io/gh/brianmcallister/api-poller-worker) [![CircleCI](https://circleci.com/gh/brianmcallister/api-poller-worker.svg?style=svg)](https://circleci.com/gh/brianmcallister/api-poller-worker) [![npm version](https://badge.fury.io/js/%40brianmcallister%2Fapi-poller-worker.svg)](https://badge.fury.io/js/%40brianmcallister%2Fapi-poller-worker)

`api-poller-worker` turns regular 'ol RESTful JSON APIs into realtime streaming connections, using polling with `WebWorkers`.

## Table of contents

- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`ApiPollerWorker`](#apipollerworker)
  - [`WorkerCore`](#workercore)
  - [`createEmptyMsg`](#createemptymsg)
  - [`Records<T>`]
  - [`Msg<T>`]

## Demo

Check out the hosted demo right here: [https://api-poller-worker.netlify.com/](https://api-poller-worker.netlify.com/)

[⇧ back to top](#table-of-contents)

## Installation

```sh
npm install @brianmcallister/api-poller-worker
```

[⇧ back to top](#table-of-contents)

## Usage

There are two distinct steps to getting this working in your application:

1. Create an `ApiPollerWorker` instance in your application, and subscribe to updates.
2. Create a web worker, which will create a `WorkerCore` instance inside of it.

What this library does _not_ help with is creating the worker files themselves. You'll have to set this up in your application's build pipeline, but there are many resources available online to guide you. You can also check out the demo application source to see how I like to set it up.

- [Worker documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Worker)
- [`worker-loader`, a webpack plugin](https://github.com/webpack-contrib/worker-loader)
- [Demo application source](https://github.com/brianmcallister/api-poller-worker/tree/master/demo)

In short, you need to tell your `ApiPollerWorker` where your worker is, and then in your worker, you need to tell `WorkerCore` where the API endpoint you'd like to poll is.

[⇧ back to top](#table-of-contents)

## API

### Classes

#### `ApiPollerWorker`

```ts
import { ApiPollerWorker } from '@brianmcallister/api-poller-worker';
```

The `ApiPollerWorker` class is what coordinates the communcation between
your app and your worker. The constructor accepts the following:

```ts
interface Options {
  // URL of the WebWorker to be created.
  workerUrl: string;
}
```

##### `ApiPollerWorker#onMessage`

Subscribe to updates from the `ApiPollerWorker` instance.

```ts
pollerWorker = new ApiPollerWorker<Resource>({
  workerUrl: '/my-worker-file.js',
});

pollerWorker.onMessage(data => {
  // `data` will be of type Msg<Resource>
  console.log('got data', data);
});
```

[⇧ back to top](#table-of-contents)

#### `WorkerCore`

```ts
import { WorkerCore } from '@brianmcallister/api-poller-worker';
```

The `WorkerCore` class is the what you need to create an instance of in your WebWorker. The constructor accepts the following options:

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

[⇧ back to top](#table-of-contents)

### Utils

#### `createEmptyMsg`

Create the [`Msg`](#msg) structure, but empty. Useful for building default state for a slice of Redux state.

```ts
import { createEmptyMsg } from '@brianmcallister/api-poller-worker';

function createEmptyMsg<T extends {}>(): Msg<T>
```

[⇧ back to top](#table-of-contents)

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

[⇧ back to top](#table-of-contents)

#### `Msg<T>`

Represents the contents of the message emitted by the `WorkerCore`.

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

[⇧ back to top](#table-of-contents)
