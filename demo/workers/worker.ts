import { WorkerCore } from '@brianmcallister/api-poller-worker';

import { Resource } from '../src/types';

// eslint-disable-next-line no-new
new WorkerCore<Resource>({
  url: process.env.POLLING_API_URL,
  interval: 5000,
});
