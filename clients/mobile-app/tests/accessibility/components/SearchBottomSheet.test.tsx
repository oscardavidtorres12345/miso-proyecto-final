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

describe('SearchBottomSheet — accessibility', () => {
  describe('destination field', () => {
    it('has a descriptive accessibilityLabel', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-destination-input').props.accessibilityLabel).toBeTruthy();
    });

    it('has a testID', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-destination-input')).toBeTruthy();
    });
  });

  describe('dates button', () => {
    it('has accessibilityRole="button"', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-dates-field').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-dates-field').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('guests button', () => {
    it('has accessibilityRole="button"', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-who-field').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-who-field').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('search button', () => {
    it('has accessibilityRole="button"', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-submit-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-submit-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('reports accessibilityState.disabled=true when fields are empty', async () => {
      const { getByTestId } = await openSheet();
      expect(getByTestId('search-submit-btn').props.accessibilityState?.disabled).toBe(true);
    });
  });
});
