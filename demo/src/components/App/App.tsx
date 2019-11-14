import React from 'react';

import LogoIcon from '../LogoIcon';

import './_app.scss';

const baseClass = 'app';

/**
 * App component.
 */
export default () => {
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
        hello
      </div>
    </div>
  );
}
