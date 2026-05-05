import React from 'react';
import { render } from '@testing-library/react-native';
import { HeroSection } from '../../../src/components/home/HeroSection';

describe('HeroSection — accessibility', () => {
  it('search button has accessibilityRole="button"', () => {
    const { getByTestId } = render(<HeroSection onOpenSearch={jest.fn()} />);
    expect(getByTestId('hero-search-btn').props.accessibilityRole).toBe('button');
  });

  it('search button has a descriptive accessibilityLabel', () => {
    const { getByTestId } = render(<HeroSection onOpenSearch={jest.fn()} />);
    expect(getByTestId('hero-search-btn').props.accessibilityLabel).toBeTruthy();
  });

  it('search button has a testID', () => {
    const { getByTestId } = render(<HeroSection onOpenSearch={jest.fn()} />);
    expect(getByTestId('hero-search-btn')).toBeTruthy();
  });
});
