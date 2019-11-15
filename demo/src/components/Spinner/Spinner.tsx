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
  <div className={baseClass}>
    <div className={`${baseClass}__segment ${baseClass}__segment--lead`} />
    <div className={`${baseClass}__segment ${baseClass}__segment--follow`} />
    <div className={`${baseClass}__mask`} />
  </div>
)
