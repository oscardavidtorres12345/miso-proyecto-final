import React from 'react';
import { render } from '@testing-library/react-native';
import { TravelSection } from '../../../src/components/home/TravelSection';

describe('TravelSection', () => {
  it('renders the section label', () => {
    const { getByText } = render(<TravelSection />);
    expect(getByText('Explora el mundo')).toBeTruthy();
  });

  it('renders the section heading', () => {
    const { getByText } = render(<TravelSection />);
    expect(getByText('Cada viaje es una historia que contar')).toBeTruthy();
  });

  it('renders the description text', () => {
    const { getByText } = render(<TravelSection />);
    expect(
      getByText(/Encuentra alojamientos únicos en los destinos más increíbles/),
    ).toBeTruthy();
  });

  it('renders mountain and sea images', () => {
    const { UNSAFE_getAllByType } = render(<TravelSection />);
    const { Image } = require('react-native');
    expect(UNSAFE_getAllByType(Image)).toHaveLength(2);
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<TravelSection />);
    expect(toJSON()).not.toBeNull();
  });
});
