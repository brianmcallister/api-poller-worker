import { WorkerCore } from '../../dist';
import { Resource } from '../src/types';

const worker = new WorkerCore<Resource>({
  url: 'https://jsonplaceholder.typicode.com/todos',
});
