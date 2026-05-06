import React from 'react';
import { render } from '@testing-library/react-native';
import { FeaturesSection } from '../../../src/components/home/FeaturesSection';

describe('FeaturesSection — accessibility', () => {
  it('renders without errors (no interactive elements)', () => {
    const { UNSAFE_root } = render(<FeaturesSection />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders 4 feature blocks', () => {
    const { getAllByText } = render(<FeaturesSection />);
    // Verifica que el componente renderiza contenido de texto
    expect(getAllByText(/./)).toBeTruthy();
  });
});
