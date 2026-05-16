import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeroSection } from '../../../src/components/home/HeroSection';

describe('HeroSection', () => {
  const onOpenSearch = jest.fn();

  afterEach(() => jest.clearAllMocks());

  it('renders the subtitle text', () => {
    const { getByText } = render(<HeroSection onOpenSearch={onOpenSearch} />);
    expect(getByText('Descubre tus próximas vacaciones')).toBeTruthy();
  });

  it('renders the title text', () => {
    const { getByText } = render(<HeroSection onOpenSearch={onOpenSearch} />);
    expect(getByText('La vida es corta y el mundo es gigante.')).toBeTruthy();
  });

  it('renders the Buscar button', () => {
    const { getByText } = render(<HeroSection onOpenSearch={onOpenSearch} />);
    expect(getByText('Buscar')).toBeTruthy();
  });

  it('calls onOpenSearch exactly once when search button is pressed', () => {
    const { getByTestId } = render(<HeroSection onOpenSearch={onOpenSearch} />);
    fireEvent.press(getByTestId('hero-search-btn'));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('renders the cover image', () => {
    const { UNSAFE_getByType } = render(<HeroSection onOpenSearch={onOpenSearch} />);
    const { Image } = require('react-native');
    expect(UNSAFE_getByType(Image)).toBeTruthy();
  });
});
