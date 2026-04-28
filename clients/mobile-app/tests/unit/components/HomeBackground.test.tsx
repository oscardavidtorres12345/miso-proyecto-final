import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeBackground } from '../../../src/components/home/HomeBackground';

describe('HomeBackground', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<HomeBackground />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders with a custom contentHeight', () => {
    const { toJSON } = render(<HomeBackground contentHeight={3000} />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders with contentHeight smaller than screen height', () => {
    const { toJSON } = render(<HomeBackground contentHeight={100} />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders with zero contentHeight', () => {
    const { toJSON } = render(<HomeBackground contentHeight={0} />);
    expect(toJSON()).not.toBeNull();
  });
});
