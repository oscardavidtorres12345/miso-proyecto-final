import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from '../../../src/screens/HomeScreen';

const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

describe('HomeScreen — accessibility', () => {
  it('renders without errors', () => {
    const { UNSAFE_root } = render(<HomeScreen onNavigateToSearch={jest.fn()} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('main search button has accessibilityRole="button"', () => {
    const { getByTestId } = render(<HomeScreen onNavigateToSearch={jest.fn()} />);
    expect(getByTestId('hero-search-btn').props.accessibilityRole).toBe('button');
  });

  it('search button has a descriptive accessibilityLabel', () => {
    const { getByTestId } = render(<HomeScreen onNavigateToSearch={jest.fn()} />);
    expect(getByTestId('hero-search-btn').props.accessibilityLabel).toBeTruthy();
  });

  it('destination images have accessibilityLabel with the city name', () => {
    const { getByTestId } = render(<HomeScreen onNavigateToSearch={jest.fn()} />);
    expect(getByTestId('destination-image-1').props.accessibilityLabel).toBe('Cartagena');
    expect(getByTestId('destination-image-2').props.accessibilityLabel).toBe('Medellín');
  });
});
