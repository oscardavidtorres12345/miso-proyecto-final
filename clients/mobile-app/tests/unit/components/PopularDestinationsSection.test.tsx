import React from 'react';
import { render } from '@testing-library/react-native';
import { PopularDestinationsSection } from '../../../src/components/home/PopularDestinationsSection';

describe('PopularDestinationsSection', () => {
  it('renders the section label', () => {
    const { getByText } = render(<PopularDestinationsSection />);
    expect(getByText('Destinos populares')).toBeTruthy();
  });

  it('renders the section heading', () => {
    const { getByText } = render(<PopularDestinationsSection />);
    expect(getByText('Los favoritos de nuestros viajeros')).toBeTruthy();
  });

  it('renders all four city names', () => {
    const { getByText } = render(<PopularDestinationsSection />);
    expect(getByText('Cartagena')).toBeTruthy();
    expect(getByText('Medellín')).toBeTruthy();
    expect(getByText('Bogotá')).toBeTruthy();
    expect(getByText('Santa Marta')).toBeTruthy();
  });

  it('renders four destination images', () => {
    const { UNSAFE_getAllByType } = render(<PopularDestinationsSection />);
    const { Image } = require('react-native');
    expect(UNSAFE_getAllByType(Image)).toHaveLength(4);
  });
});
