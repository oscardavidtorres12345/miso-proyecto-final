import React from 'react';
import { render } from '@testing-library/react-native';
import { Footer } from '../../../src/components/common/Footer';

const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

describe('Footer', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<Footer />);
    expect(toJSON()).not.toBeNull();
  });

  it('has the footer testID', () => {
    const { getByTestId } = render(<Footer />);
    expect(getByTestId('footer')).toBeTruthy();
  });

  it('displays the madeWithLove text', () => {
    const { getByText } = render(<Footer />);
    expect(getByText('Hecho con amor 💚')).toBeTruthy();
  });

  it('applies bottom safe area inset', () => {
    __setSafeAreaInsets({ top: 0, right: 0, bottom: 34, left: 0 });
    const { getByTestId } = render(<Footer />);
    const footer = getByTestId('footer');
    expect(footer.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingBottom: 34 })])
    );
  });

  it('uses minimum 16px bottom padding when safe area inset is 0', () => {
    __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
    const { getByTestId } = render(<Footer />);
    const footer = getByTestId('footer');
    expect(footer.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingBottom: 16 })])
    );
  });
});
