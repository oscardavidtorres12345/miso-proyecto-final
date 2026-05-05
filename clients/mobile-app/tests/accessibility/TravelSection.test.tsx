import React from 'react';
import { Image } from 'react-native';
import { render } from '@testing-library/react-native';
import { TravelSection } from '../../src/components/home/TravelSection';

describe('TravelSection — accesibilidad', () => {
  it('renderiza sin errores', () => {
    const { UNSAFE_root } = render(<TravelSection />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('las imágenes decorativas tienen testID', () => {
    const { UNSAFE_getAllByType } = render(<TravelSection />);
    const images = UNSAFE_getAllByType(Image);
    const mountain = images.find((img) => img.props.testID === 'travel-mountain-image');
    const sea = images.find((img) => img.props.testID === 'travel-sea-image');
    expect(mountain).toBeTruthy();
    expect(sea).toBeTruthy();
  });

  it('el contenedor de imágenes está marcado como oculto para lectores de pantalla', () => {
    const { UNSAFE_root } = render(<TravelSection />);
    // Verificar que el contenedor de imágenes tiene accessibilityElementsHidden=true
    const findHiddenContainer = (node: any): boolean => {
      if (node.props?.accessibilityElementsHidden === true) return true;
      if (node.children) {
        return node.children.some((child: any) => findHiddenContainer(child));
      }
      return false;
    };
    expect(findHiddenContainer(UNSAFE_root)).toBe(true);
  });
});
