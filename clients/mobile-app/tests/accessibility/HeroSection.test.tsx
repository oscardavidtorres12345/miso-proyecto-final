import React from 'react';
import { render } from '@testing-library/react-native';
import { HeroSection } from '../../src/components/home/HeroSection';

describe('HeroSection — accesibilidad', () => {
  it('el botón de búsqueda tiene accessibilityRole="button"', () => {
    const { getByTestId } = render(<HeroSection onOpenSearch={jest.fn()} />);
    expect(getByTestId('hero-search-btn').props.accessibilityRole).toBe('button');
  });

  it('el botón de búsqueda tiene accessibilityLabel descriptivo', () => {
    const { getByTestId } = render(<HeroSection onOpenSearch={jest.fn()} />);
    expect(getByTestId('hero-search-btn').props.accessibilityLabel).toBeTruthy();
  });

  it('el botón de búsqueda tiene testID', () => {
    const { getByTestId } = render(<HeroSection onOpenSearch={jest.fn()} />);
    expect(getByTestId('hero-search-btn')).toBeTruthy();
  });
});
