import WorkerCore from './src/WorkerCore';
import { Resource } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const worker = new WorkerCore<Resource>({ url: 'url' });
