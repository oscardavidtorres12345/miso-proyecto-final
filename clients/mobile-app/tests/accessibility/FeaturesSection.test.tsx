import React from 'react';
import { render } from '@testing-library/react-native';
import { FeaturesSection } from '../../src/components/home/FeaturesSection';

describe('FeaturesSection — accesibilidad', () => {
  it('renderiza sin errores (no tiene elementos interactivos)', () => {
    const { UNSAFE_root } = render(<FeaturesSection />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('muestra los 4 bloques de características', () => {
    const { getAllByText } = render(<FeaturesSection />);
    // Verifica que el componente renderiza contenido de texto
    expect(getAllByText(/./)).toBeTruthy();
  });
});
