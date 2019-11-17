declare module 'react-flip-numbers' {
  import React from 'react';

  interface Props {
    height: number;
    width: number;
    play: boolean;
    duration: number;
    numbers: string;
  }

  const FlipNumbers: React.ComponentClass<Props>;

  export default FlipNumbers;
}
