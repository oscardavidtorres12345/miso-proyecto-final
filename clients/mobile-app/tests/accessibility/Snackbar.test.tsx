import React from 'react';
import { render } from '@testing-library/react-native';
import { Snackbar } from '../../src/components/common/Snackbar';

const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  jest.useFakeTimers();
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const baseProps = {
  show: true,
  message: 'Reserva cancelada',
  variant: 'success' as const,
  onClose: jest.fn(),
};

describe('Snackbar — accesibilidad', () => {
  it('el botón de cierre tiene accessibilityRole="button"', () => {
    const { getByTestId } = render(<Snackbar {...baseProps} />);
    expect(getByTestId('snackbar-close').props.accessibilityRole).toBe('button');
  });

  it('el botón de cierre tiene accessibilityLabel descriptivo', () => {
    const { getByTestId } = render(<Snackbar {...baseProps} />);
    expect(getByTestId('snackbar-close').props.accessibilityLabel).toBeTruthy();
  });

  it('el contenedor tiene accessibilityLiveRegion para anunciar mensajes', () => {
    const { getByTestId } = render(<Snackbar {...baseProps} />);
    expect(getByTestId('snackbar').props.accessibilityLiveRegion).toBe('polite');
  });

  it('el contenedor tiene testID para ser referenciado', () => {
    const { getByTestId } = render(<Snackbar {...baseProps} testID="my-snackbar" />);
    expect(getByTestId('my-snackbar')).toBeTruthy();
    expect(getByTestId('my-snackbar-close')).toBeTruthy();
  });
});
