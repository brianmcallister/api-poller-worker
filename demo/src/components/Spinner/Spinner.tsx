import React from 'react';

import './_spinner.scss';

/**
 * Base CSS class.
 * @private
 */
const baseClass = 'spinner';

/**
 * Spinner component.
 */
export default () => (
  <span className={baseClass}>
    <span className={`${baseClass}__segment ${baseClass}__segment--lead`} />
    <span className={`${baseClass}__segment ${baseClass}__segment--follow`} />
    <span className={`${baseClass}__mask`} />
  </span>
);
