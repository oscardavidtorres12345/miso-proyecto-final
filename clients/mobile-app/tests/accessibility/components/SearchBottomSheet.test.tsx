import React from 'react';
import { PanResponder } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { SearchBottomSheet } from '../../../src/components/search/SearchBottomSheet';

jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => ({
  panHandlers: {},
  ...config,
}) as any);

const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  jest.clearAllMocks();
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

async function openSheet(props = {}) {
  const utils = render(
    <SearchBottomSheet isOpen={true} onClose={jest.fn()} {...props} />,
  );
  await waitFor(() => utils.getByPlaceholderText('¿Adónde vas?'));
  return utils;
}

describe('SearchBottomSheet — accesibilidad', () => {
  describe('campo destino', () => {
    it('tiene accessibilityLabel descriptivo', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-destination-input').props.accessibilityLabel).toBeTruthy();
    });

    it('tiene testID para ser referenciado', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-destination-input')).toBeTruthy();
    });
  });

  describe('botón fechas', () => {
    it('tiene accessibilityRole="button"', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-dates-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-dates-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('botón huéspedes', () => {
    it('tiene accessibilityRole="button"', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-guests-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-guests-btn').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('botón buscar', () => {
    it('tiene accessibilityRole="button"', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-search-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-search-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('comunica accessibilityState.disabled=true cuando los campos están vacíos', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('sheet-search-btn').props.accessibilityState?.disabled).toBe(true);
    });
  });
});
