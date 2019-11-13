import WorkerCore from './src/WorkerCore';
import { Resource } from './types';

const worker = new WorkerCore<Resource>({
  url: 'url',
});
