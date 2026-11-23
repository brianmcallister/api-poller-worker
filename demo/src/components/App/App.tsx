import { ApiPollerWorker, createEmptyMsg, type Msg } from 'api-poller-worker';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { useEffect, useReducer, useState } from 'react';

import type { Resource } from '../../types';
import LogoIcon from '../LogoIcon';
import RenderedItem from '../RenderedItem';
import Spinner from '../Spinner';

import './_app.scss';

hljs.registerLanguage('json', json);

/** The demo API, a Vercel function from brianmcallister/api-poller-worker-demo-server. */
const API_URL =
  (import.meta.env.VITE_POLLING_API_URL as string | undefined) ??
  'https://api-poller-worker-demo-server.vercel.app/';

interface State {
  ids: string[];
  byId: Record<string, Resource>;
}

const baseClass = 'app';

/**
 * Pad `list` with nulls up to `min` items, so each section keeps its height.
 */
const padded = <T,>(list: T[], min = 3): (T | null)[] =>
  list.length >= min ? list : [...list, ...Array<null>(min - list.length).fill(null)];

/**
 * Apply a message from the worker to the current state.
 */
const reducer = (state: State, msg: Msg<Resource>): State => {
  const removed = new Set(msg.removedItems);
  const byId = { ...state.byId, ...msg.newItems.byId, ...msg.updatedItems.byId };

  for (const id of removed) {
    delete byId[id];
  }

  return {
    ids: state.ids.concat(msg.newItems.ids).filter((id) => !removed.has(id)),
    byId,
  };
};

/**
 * One list of new, updated or removed items in the latest message.
 */
const MessageSection = ({
  ids,
  items,
  title,
  type,
}: {
  ids: string[];
  items?: Record<string, Resource>;
  title: string;
  type: 'new' | 'updated' | 'removed';
}) => (
  <div className={`${baseClass}__message-type ${baseClass}__message-type--${type}`}>
    <div className={`${baseClass}__message-title`}>
      {title}
      <span className={`${baseClass}__count`}>{ids.length}</span>
    </div>

    <div className={`${baseClass}__message-items`}>
      {padded(ids).map((id, index) => {
        const item = id === null ? undefined : items?.[id];

        return (
          <div
            key={id ?? `empty-${String(index)}`}
            className={`${baseClass}__message-item${id === null ? ` ${baseClass}__message-item--empty` : ''}`}
          >
            {id === null && <span className={`${baseClass}__message-field`}>∅</span>}
            {id !== null && !item && <span className={`${baseClass}__message-field`}>{id}</span>}
            {item && (
              <>
                <span className={`${baseClass}__message-field`}>{item.id}</span>
                <span className={`${baseClass}__message-field`}>{item.name}</span>
                <span className={`${baseClass}__message-field`}>{item.price}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

/**
 * App component.
 */
const App = () => {
  const [state, dispatch] = useReducer(reducer, { ids: [], byId: {} });
  const [message, setMessage] = useState<Msg<Resource>>(createEmptyMsg);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The inline worker is built into the package, so there's no worker file to set up.
    const poller = new ApiPollerWorker<Resource>({ inline: true, apiUrl: API_URL, interval: 2000 })
      .onMessage((msg) => {
        setMessage(msg);
        setError(null);
        dispatch(msg);
      })
      .onError((reason) => {
        setError(reason.message);
      });

    return () => {
      poller.terminate();
    };
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
          <a href="https://npmjs.com/package/api-poller-worker">npm</a>
        </div>
      </header>

      {error && (
        <p className={`${baseClass}__error`} role="alert">
          Polling failed: {error}
        </p>
      )}

      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__message`}>
          <p className={`${baseClass}__section-title`}>
            <Spinner />
            Worker messages
          </p>

          <MessageSection
            ids={message.newItems.ids}
            items={message.newItems.byId}
            title="New"
            type="new"
          />
          <MessageSection
            ids={message.updatedItems.ids}
            items={message.updatedItems.byId}
            title="Updated"
            type="updated"
          />
          <MessageSection ids={message.removedItems} title="Removed" type="removed" />
        </div>

        <div className={`${baseClass}__state`}>
          <p className={`${baseClass}__section-title`}>
            <span className={`${baseClass}__badge`}>&#x21BB;</span>
            Current state
          </p>

          <pre className="hljs">
            <code
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(JSON.stringify(state, null, 4), { language: 'json' })
                  .value,
              }}
            />
          </pre>
        </div>

        <div className={`${baseClass}__rendered`}>
          <p className={`${baseClass}__section-title`}>
            <span className={`${baseClass}__badge`}>&#x21BB;</span>
            Items
          </p>

          <div className={`${baseClass}__rendered-items`}>
            {state.ids.map((id) => {
              const item = state.byId[id];

              return item ? (
                <RenderedItem key={id} id={item.id} name={item.name} price={item.price} />
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
