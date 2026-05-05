import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeBackground } from '../../src/components/home/HomeBackground';

describe('HomeBackground — accesibilidad', () => {
  it('renderiza sin errores (componente puramente decorativo)', () => {
    const { UNSAFE_root } = render(<HomeBackground />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renderiza con contentHeight sin errores', () => {
    const { UNSAFE_root } = render(<HomeBackground contentHeight={2000} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
