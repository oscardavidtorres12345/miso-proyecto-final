import React from 'react';
import { render } from '@testing-library/react-native';
import { PopularDestinationsSection } from '../../src/components/home/PopularDestinationsSection';

describe('PopularDestinationsSection — accesibilidad', () => {
  it('las imágenes de destino tienen accessibilityLabel con el nombre de la ciudad', () => {
    const { getByTestId } = render(<PopularDestinationsSection />);

    const cartagena = getByTestId('destination-image-1');
    expect(cartagena.props.accessibilityLabel).toBe('Cartagena');

    const medellin = getByTestId('destination-image-2');
    expect(medellin.props.accessibilityLabel).toBe('Medellín');

    const bogota = getByTestId('destination-image-3');
    expect(bogota.props.accessibilityLabel).toBe('Bogotá');

    const santaMarta = getByTestId('destination-image-4');
    expect(santaMarta.props.accessibilityLabel).toBe('Santa Marta');
  });

  it('cada imagen tiene un testID único', () => {
    const { getByTestId } = render(<PopularDestinationsSection />);
    expect(getByTestId('destination-image-1')).toBeTruthy();
    expect(getByTestId('destination-image-2')).toBeTruthy();
    expect(getByTestId('destination-image-3')).toBeTruthy();
    expect(getByTestId('destination-image-4')).toBeTruthy();
  });
});
