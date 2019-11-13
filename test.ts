import ApiPollerWorker from './src/ApiPollerWorker';
import { Resource } from './types';

const apiPoller = new ApiPollerWorker<Resource>({
  workerUrl: 'url',
  apiUrl: 'url',
});

apiPoller.onMessage(data => console.log(data))
