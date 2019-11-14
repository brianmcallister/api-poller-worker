import { ApiPollerWorker, Msg, createEmptyMsg } from '../../../../dist';
import React from 'react';
import FlipMove from 'react-flip-move';

import { Resource } from '../../types';
import LogoIcon from '../LogoIcon';

import './_app.scss';

interface State {
  ids: string[];
  byId: { [id: string]: Resource };
}

interface Action {
  type: 'update';
  payload: Msg<Resource>;
}

const baseClass = 'app';
const createInitialState = () => ({ ids: [], byId: {} });
const initialState = createInitialState();

const reducer = (state: State, action: Action) => {
  const { type, payload } = action;

  switch (type) {
    case 'update': {
      const { newItems, updatedItems, removedItems } = payload;
      const newState = { ...state };

      // First, append the new items.
      newState.ids = newState.ids.concat(newItems.ids);
      newState.byId = { ...newState.byId, ...newItems.byId };

      // Next, remove the removed items.
      newState.ids = newState.ids.filter(id => !removedItems.includes(id));
      removedItems.forEach(id => delete newState.byId[id]);

      // Finally, update the updated items.
      Object.values(updatedItems.byId)
        .forEach(item => { newState.byId[item.id] = item });

      return newState;
    }

    default:
      return state;
  }
}

/**
 * App component.
 */
export default () => {
  let pollerWorker;

  const [state, dispatch] = React.useReducer(reducer, initialState, createInitialState);
  const [items, setItems] = React.useState<Msg<Resource>>(createEmptyMsg());
  React.useEffect(() => {
    pollerWorker = new ApiPollerWorker<Resource>({
      workerUrl: '/dist/workers/main.worker.bundle.js',
    });

    pollerWorker.onMessage(data => {
      setItems(data);
      dispatch({ type: 'update', payload: data });
    });
  }, []);
  return (
    <div className={baseClass}>
      <header className={`${baseClass}__header`}>
        <LogoIcon />

        <a className={`${baseClass}__header-link`} href="https://www.brianmcallister.com">
          Brian Wm. McAllister
        </a>

        <div className={`${baseClass}__header-links`}>
          <a href="https://github.com/brianmcallister/react-auto-scroll">GitHub</a>
          <a href="https://npmjs.com/package/@brianmcallister/react-auto-scroll">npm</a>
        </div>
      </header>

      <div style={{ color: 'white' }} className={`${baseClass}__content`}>
        <pre>{JSON.stringify(items, null, 2)}</pre>
        <div>
          <FlipMove staggerDurationBy={50}>
            {state.ids.map(id => <div key={state.byId[id].id}>{state.byId[id].name}</div>)}
          </FlipMove>
        </div>
      </div>
    </div>
  );
}
