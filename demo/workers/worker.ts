import { WorkerCore } from '../../dist';
import { Resource } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const worker = new WorkerCore<Resource>({
  url: 'http://localhost:3000',
  interval: 5000,
});
