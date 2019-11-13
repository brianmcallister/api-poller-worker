import { WorkerCore } from '../../dist';
import { Resource } from '../src/types';

const worker = new WorkerCore<Resource>({
  url: 'http://localhost:3000',
  interval: 5000,
});
