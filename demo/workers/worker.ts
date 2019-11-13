import { WorkerCore } from '../../dist';
import { Resource } from '../src/types';

// eslint-disable-next-line no-new
new WorkerCore<Resource>({
  url: 'http://localhost:3000',
  interval: 5000,
});
