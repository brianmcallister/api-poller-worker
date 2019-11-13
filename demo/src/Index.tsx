import React from 'react';
import ReactDOM from 'react-dom';

import { ApiPollerWorker } from '../../dist';
import { Resource } from './types';

const pollerWorker = new ApiPollerWorker<Resource>({
  workerUrl: '/workers-dist/main.bundle.js',
  interval: 10000,
});

pollerWorker.onMessage(data => console.log('data', data));

import './styles/style.scss';

import App from './components/App';

ReactDOM.render(<App />, document.querySelector('#root'));
