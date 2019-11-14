import { ApiPollerWorker, Msg, createEmptyMsg } from '../../../../dist';
import classnames from 'classnames';
import Highlight from 'react-highlight.js';
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

function paddedArray<T>(arr: T[], min = 3) {
  if (arr.length >= min) {
    return arr;
  }

  return [...arr, ...(new Array(min - arr.length))];
}

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

      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__message`}>
          <p className={`${baseClass}__section-title`}>Worker messages</p>

          <div className={`${baseClass}__message-type ${baseClass}__message-type--new`}>
            <p className={`${baseClass}__message-title`}>
              New <span>{items.newItems.ids.length}</span>
            </p>

            <div className={`${baseClass}__message-items`}>
              {paddedArray(items.newItems.ids).map(id => (
                <div className={classnames(`${baseClass}__message-item`, { [`${baseClass}__message-item--empty`]: !id })}>
                  {id && (
                    <>
                      <span className={`${baseClass}__message-field`}>{items.newItems.byId[id].id}</span>
                      <span className={`${baseClass}__message-field`}>{items.newItems.byId[id].name}</span>
                      <span className={`${baseClass}__message-field`}>{items.newItems.byId[id].price}</span>
                    </>
                  )}

                  {!id && (
                    <span className={`${baseClass}__message-field`}>—</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`${baseClass}__message-type ${baseClass}__message-type--updated`}>
            <header className={`${baseClass}__message-title`}>
              Updated <span>{items.updatedItems.ids.length}</span>
            </header>

            <div className={`${baseClass}__message-items`}>
              {paddedArray(items.updatedItems.ids).map(id => (
                <div className={classnames(`${baseClass}__message-item`, { [`${baseClass}__message-item--empty`]: !id })}>
                  {id && (
                    <>
                      <span className={`${baseClass}__message-field`}>{items.updatedItems.byId[id].id}</span>
                      <span className={`${baseClass}__message-field`}>{items.updatedItems.byId[id].name}</span>
                      <span className={`${baseClass}__message-field`}>{items.updatedItems.byId[id].price}</span>
                    </>
                  )}

                  {!id && (
                    <span className={`${baseClass}__message-field`}>—</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`${baseClass}__message-type ${baseClass}__message-type--removed`}>
            <header className={`${baseClass}__message-title`}>
              Removed <span>{items.removedItems.length}</span>
            </header>

            <div className={`${baseClass}__message-items`}>
              {paddedArray(items.removedItems).map(id => (
                <div className={classnames(`${baseClass}__message-item`, { [`${baseClass}__message-item--empty`]: !id })}>
                  {id && (
                    <span className={`${baseClass}__message-field`}>{id}</span>
                  )}

                  {!id && (
                    <span className={`${baseClass}__message-field`}>—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${baseClass}__state`}>
          <p className={`${baseClass}__section-title`}>Current state</p>

          <Highlight>
            {JSON.stringify(state, null, 2)}
          </Highlight>
        </div>

        <div className={`${baseClass}__rendered`}>
          <p className={`${baseClass}__section-title`}>Items</p>

          <FlipMove staggerDurationBy={50}>
            {state.ids.map(id => <div key={state.byId[id].id}>{state.byId[id].name}</div>)}
          </FlipMove>
        </div>
      </div>
    </div>
  );
}
