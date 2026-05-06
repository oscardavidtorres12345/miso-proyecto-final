import React from 'react';
import { Image } from 'react-native';
import { render } from '@testing-library/react-native';
import { TravelSection } from '../../../src/components/home/TravelSection';

describe('TravelSection — accessibility', () => {
  it('renders without errors', () => {
    const { UNSAFE_root } = render(<TravelSection />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('decorative images have testIDs', () => {
    const { UNSAFE_getAllByType } = render(<TravelSection />);
    const images = UNSAFE_getAllByType(Image);
    const mountain = images.find((img) => img.props.testID === 'travel-mountain-image');
    const sea = images.find((img) => img.props.testID === 'travel-sea-image');
    expect(mountain).toBeTruthy();
    expect(sea).toBeTruthy();
  });

  it('images container is marked as hidden for screen readers', () => {
    const { UNSAFE_root } = render(<TravelSection />);
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
