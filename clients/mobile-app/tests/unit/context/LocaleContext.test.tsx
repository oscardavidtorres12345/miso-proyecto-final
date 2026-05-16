import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LocaleProvider, useLocale, COUNTRIES } from '../../../src/context/LocaleContext';
import { getLocale, setLocale } from '../../../src/i18n';

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

function LocaleConsumer() {
  const { selectedCountry, locale } = useLocale();
  return <Text testID="output">{`${selectedCountry.code}:${locale}`}</Text>;
}

function CountrySetter({ code }: { code: string }) {
  const { setSelectedCountry } = useLocale();
  const country = COUNTRIES.find(c => c.code === code)!;
  return (
    <Text testID="setter" onPress={() => setSelectedCountry(country)}>
      set
    </Text>
  );
}

beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  AsyncStorage.getItem.mockResolvedValue(null);
});

afterEach(() => {
  setLocale('es-CO');
});

describe('LocaleProvider', () => {
  it('defaults to Colombia (es-CO) when AsyncStorage has no saved value', async () => {
    const { getByTestId } = render(
      <LocaleProvider>
        <LocaleConsumer />
      </LocaleProvider>,
    );

    await act(async () => {});

    expect(getByTestId('output').props.children).toBe('co:es-CO');
  });

  it('restores saved country from AsyncStorage on mount', async () => {
    AsyncStorage.getItem.mockResolvedValue('ar');

    const { getByTestId } = render(
      <LocaleProvider>
        <LocaleConsumer />
      </LocaleProvider>,
    );

    await act(async () => {});

    expect(getByTestId('output').props.children).toBe('ar:es-AR');
  });

  it('falls back to Colombia when AsyncStorage has an unknown code', async () => {
    AsyncStorage.getItem.mockResolvedValue('xx');

    const { getByTestId } = render(
      <LocaleProvider>
        <LocaleConsumer />
      </LocaleProvider>,
    );

    await act(async () => {});

    expect(getByTestId('output').props.children).toBe('co:es-CO');
  });

  it('updates locale and persists to AsyncStorage when setSelectedCountry is called', async () => {
    const { getByTestId } = render(
      <LocaleProvider>
        <LocaleConsumer />
        <CountrySetter code="us" />
      </LocaleProvider>,
    );

    await act(async () => {});

    act(() => {
      getByTestId('setter').props.onPress();
    });

    expect(getByTestId('output').props.children).toBe('us:en-US');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('travel-hub-country', 'us');
  });

  it('updates i18n language when setSelectedCountry is called', async () => {
    const { getByTestId } = render(
      <LocaleProvider>
        <LocaleConsumer />
        <CountrySetter code="ar" />
      </LocaleProvider>,
    );

    await act(async () => {});

    act(() => {
      getByTestId('setter').props.onPress();
    });

    expect(getLocale()).toBe('es-AR');
  });
});

describe('useLocale', () => {
  it('throws when used outside LocaleProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<LocaleConsumer />)).toThrow(
      'useLocale must be used within LocaleProvider',
    );
    spy.mockRestore();
  });
});
