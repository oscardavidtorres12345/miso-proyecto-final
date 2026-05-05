import React from 'react';
import { render } from '@testing-library/react-native';
import { SplashScreen } from '../../../src/screens/SplashScreen';

describe('SplashScreen — accesibilidad', () => {
  it('renderiza sin errores (pantalla puramente decorativa)', () => {
    const { UNSAFE_root } = render(<SplashScreen />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('no contiene elementos interactivos', () => {
    const { UNSAFE_root } = render(<SplashScreen />);
    const findTouchable = (node: any): boolean => {
      if (!node) return false;
      const type = node.type?.displayName ?? node.type?.name ?? '';
      if (type.includes('TouchableOpacity') || type.includes('Pressable')) return true;
      if (node.children) return node.children.some((c: any) => findTouchable(c));
      return false;
    };
    expect(findTouchable(UNSAFE_root)).toBe(false);
  });
});
