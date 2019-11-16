import classnames from 'classnames';
import React from 'react';

import './_rendered-item.scss';

interface Props {
  id: string;
  name: string;
  price: number;
}

interface State {
  flash: boolean;
  newItem: boolean;
}

/**
 * RenderedItem component.
 */
export default class RenderedItem extends React.PureComponent<Props, State> {
  /**
   * Format a money value.
   * @static
   */
  static formatMoney = (val: number) =>
    new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(val);

  /**
   * Constructor.
   * @constructor
   */
  constructor(props: Props) {
    super(props);

    this.state = {
      flash: false,
      newItem: false,
    };
  }

  /**
   * Component did mount.
   */
  componentDidMount = () => {
    setTimeout(() => {
      this.setState({ newItem: true }, () => {
        setTimeout(() => {
          this.setState({ newItem: false });
        }, 500);
      });
    }, 0);
  };

  /**
   * Component did update.
   */
  componentDidUpdate = (prevProps: Props) => {
    const { price } = this.props;

    if (prevProps.price !== price) {
      setTimeout(() => {
        this.setState({ flash: true }, () => {
          setTimeout(() => {
            this.setState({ flash: false });
          }, 100);
        });
      }, 850);
    }
  };

  /**
   * Base CSS class.
   * @static
   */
  static baseClass = 'rendered-item';

  /**
   * Render.
   */
  render = () => {
    const { id, name, price } = this.props;
    const { flash, newItem } = this.state;
    const cls = classnames(RenderedItem.baseClass, {
      [`${RenderedItem.baseClass}--flash`]: flash,
      [`${RenderedItem.baseClass}--new`]: newItem,
    });

    return (
      <div className={cls}>
        <span>{`⋮ ${id}`}</span>
        <span>{name}</span>
        <span>{RenderedItem.formatMoney(price)}</span>
      </div>
    );
  };
}
