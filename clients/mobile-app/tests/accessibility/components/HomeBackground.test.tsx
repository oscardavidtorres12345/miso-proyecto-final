import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeBackground } from '../../../src/components/home/HomeBackground';

describe('HomeBackground — accessibility', () => {
  it('renders without errors (purely decorative component)', () => {
    const { UNSAFE_root } = render(<HomeBackground />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with contentHeight without errors', () => {
    const { UNSAFE_root } = render(<HomeBackground contentHeight={2000} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
