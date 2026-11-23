# Changelog

## 2.0.0

### Breaking changes

- The worker sends its updates as `{ type: 'update', msg }` and its errors as `{ type: 'error', message }`. `ApiPollerWorker` unpacks them, so this only matters if you read the worker's messages yourself. The page and your own worker need to use the same version of this package.
- IDs in `Msg` and `Records` are always strings. They were typed as strings before, but numeric IDs from the API were passed through as numbers.
- The package has an `exports` map, so deep imports from `dist/` no longer work.

### Fixes

- `inline: true` didn't work in any published version. The build step that turned the inline worker into a string never ran when publishing, so the package shipped compiled code where it expected a string, and creating an inline worker threw. The worker is now bundled into a string by the package build, and a test runs that string.
- Importing the package outside a worker or browser, for example during server rendering, threw `ReferenceError: self is not defined`. `WorkerCore` now only touches the worker's global scope when it's created.
- Error responses were parsed and passed along as data, and a response that wasn't an array caused an uncaught error in the worker. Both are now reported as errors.
- Errors only went to `console.error`. They're now sent to the page, and passed to the new `onError`.
- The inline worker's API URL was spliced into its code with `String#replace`, so some URLs could corrupt it. Its options are now sent in a message.
- Comparing responses checked each ID against every other ID. It now uses sets.

### Other changes

- New `worker` option to pass in a `Worker` you created, which works with bundlers that build workers from `new Worker(new URL(...))`.
- New `onError` and `terminate` methods on `ApiPollerWorker`.
- Inline mode accepts `interval`, `uniqueKey` and `fetchOptions`.
- `workerUrl` accepts a `URL` as well as a string.
- Ships ES modules and CommonJS, with TypeScript types for both. Built with tsup and tested with Vitest. CI runs on GitHub Actions, and releases are published from GitHub with npm provenance.
