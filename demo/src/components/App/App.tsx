import { ApiPollerWorker, Msg, createEmptyMsg } from '@brianmcallister/api-poller-worker';
import classnames from 'classnames';
import FlipMove from 'react-flip-move';
import Highlight from 'react-highlight.js';
import React from 'react';

import { Resource } from '../../types';
import LogoIcon from '../LogoIcon';
import RenderedItem from '../RenderedItem';
import Spinner from '../Spinner';

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

  return [...arr, ...new Array(min - arr.length)];
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
      Object.values(updatedItems.byId).forEach(item => {
        newState.byId[item.id] = item;
      });

      return newState;
    }

    default:
      return state;
  }
};

/**
 * App component.
 */
export default () => {
  let pollerWorker;

  const [state, dispatch] = React.useReducer(reducer, initialState, createInitialState);
  const [items, setItems] = React.useState<Msg<Resource>>(createEmptyMsg());

  React.useEffect(() => {
    pollerWorker = new ApiPollerWorker<Resource>({
      workerUrl: '/workers/main.worker.bundle.js',
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
          <a href="https://github.com/brianmcallister/api-poller-worker">GitHub</a>
          <a href="https://npmjs.com/package/@brianmcallister/api-poller-worker">npm</a>
        </div>
      </header>

      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__message`}>
          <p className={`${baseClass}__section-title`}>
            <Spinner />
            Worker messages
          </p>

          <div className={`${baseClass}__message-type ${baseClass}__message-type--new`}>
            <p className={`${baseClass}__message-title`}>
              New <span>{items.newItems.ids.length}</span>
            </p>

            <div className={`${baseClass}__message-items`}>
              {paddedArray(items.newItems.ids).map(id => (
                <div
                  key={id || Math.random()}
                  className={classnames(`${baseClass}__message-item`, {
                    [`${baseClass}__message-item--empty`]: !id,
                  })}
                >
                  {id && (
                    <>
                      <span className={`${baseClass}__message-field`}>
                        {items.newItems.byId[id].id}
                      </span>
                      <span className={`${baseClass}__message-field`}>
                        {items.newItems.byId[id].name}
                      </span>
                      <span className={`${baseClass}__message-field`}>
                        {items.newItems.byId[id].price}
                      </span>
                    </>
                  )}

                  {!id && <span className={`${baseClass}__message-field`}>∅</span>}
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
                <div
                  key={id || Math.random()}
                  className={classnames(`${baseClass}__message-item`, {
                    [`${baseClass}__message-item--empty`]: !id,
                  })}
                >
                  {id && (
                    <>
                      <span className={`${baseClass}__message-field`}>
                        {items.updatedItems.byId[id].id}
                      </span>
                      <span className={`${baseClass}__message-field`}>
                        {items.updatedItems.byId[id].name}
                      </span>
                      <span className={`${baseClass}__message-field`}>
                        {items.updatedItems.byId[id].price}
                      </span>
                    </>
                  )}

                  {!id && <span className={`${baseClass}__message-field`}>∅</span>}
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
                <div
                  key={id || Math.random()}
                  className={classnames(`${baseClass}__message-item`, {
                    [`${baseClass}__message-item--empty`]: !id,
                  })}
                >
                  {id && <span className={`${baseClass}__message-field`}>{id}</span>}

                  {!id && (
                    <span className={`${baseClass}__message-field`}>
                      <strong>∅</strong>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${baseClass}__state`}>
          <p className={`${baseClass}__section-title`}>
            <span className={`${baseClass}__badge`}>&#x21BB;</span>
            Current state
          </p>

          <Highlight language="json">{JSON.stringify(state, null, 4)}</Highlight>
        </div>

        <div className={`${baseClass}__rendered`}>
          <p className={`${baseClass}__section-title`}>
            <span className={`${baseClass}__badge`}>&#x21BB;</span>
            Items
          </p>

          <FlipMove className={`${baseClass}__rendered-items`} staggerDurationBy={50}>
            {state.ids.map(id => (
              <RenderedItem
                key={state.byId[id].id}
                id={state.byId[id].id}
                name={state.byId[id].name}
                price={state.byId[id].price}
              />
            ))}
          </FlipMove>
        </div>
      </div>
    </div>
  );
};
