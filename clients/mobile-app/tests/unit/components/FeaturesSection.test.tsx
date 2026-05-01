import React from 'react';
import { render } from '@testing-library/react-native';
import { FeaturesSection } from '../../../src/components/home/FeaturesSection';

describe('FeaturesSection', () => {
  it('renders all four feature titles', () => {
    const { getByText } = render(<FeaturesSection />);
    expect(getByText('Reservas seguras')).toBeTruthy();
    expect(getByText('Mejores precios')).toBeTruthy();
    expect(getByText('Cancelación flexible')).toBeTruthy();
    expect(getByText('Paga en pesos colombianos')).toBeTruthy();
  });

  it('renders all four descriptions', () => {
    const { getByText } = render(<FeaturesSection />);
    expect(getByText('Tus pagos y datos están protegidos en todo momento.')).toBeTruthy();
    expect(getByText('Comparamos tarifas para que siempre encuentres la mejor opción.')).toBeTruthy();
    expect(getByText('Cambia de planes sin estrés con reembolso disponible.')).toBeTruthy();
    expect(getByText('Ve los precios en COP, sin sorpresas al finalizar.')).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<FeaturesSection />);
    expect(toJSON()).not.toBeNull();
  });
});
