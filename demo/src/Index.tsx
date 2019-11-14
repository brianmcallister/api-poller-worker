import React from 'react';
import ReactDOM from 'react-dom';

import { ApiPollerWorker } from '../../dist';
import { Resource } from './types';
import App from './components/App';

import './styles/style.scss';

const pollerWorker = new ApiPollerWorker<Resource>({
  workerUrl: '/main.worker.bundle.js',
});

pollerWorker.onMessage(data => console.log('data', data.newItems, 'u', data.updatedItems));

ReactDOM.render(<App />, document.querySelector('#root'));
