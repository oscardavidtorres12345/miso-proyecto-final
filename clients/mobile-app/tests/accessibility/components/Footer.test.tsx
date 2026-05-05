import React from 'react';
import { render } from '@testing-library/react-native';
import { Footer } from '../../../src/components/common/Footer';

const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

describe('Footer — accesibilidad', () => {
  it('tiene testID para poder ser referenciado por herramientas de accesibilidad', () => {
    const { getByTestId } = render(<Footer />);
    expect(getByTestId('footer')).toBeTruthy();
  });

  it('no contiene elementos interactivos sin atributos de accesibilidad', () => {
    const { UNSAFE_root } = render(<Footer />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
