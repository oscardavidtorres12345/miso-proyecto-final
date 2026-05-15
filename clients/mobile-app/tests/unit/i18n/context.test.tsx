import React from 'react';
import { act, render } from '@testing-library/react-native';
import { setLocale } from '../../../src/i18n';
import esCO from '../../../src/i18n/locales/es-CO';
import enUS from '../../../src/i18n/locales/en-US';

jest.mock('../../../src/services/identityService');
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ setAuthData: jest.fn() }),
}));

import { LoginScreen } from '../../../src/screens/LoginScreen';

afterEach(async () => {
  await setLocale('es-CO');
});

describe('react-i18next context propagation', () => {
  it('language change propagates to already-mounted components', async () => {
    await setLocale('es-CO');
    const { getByText, queryByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);

    expect(getByText(esCO.login.submit)).toBeTruthy();

    await act(async () => {
      await setLocale('en-US');
    });

    expect(queryByText(esCO.login.submit)).toBeNull();
    expect(getByText(enUS.login.submit)).toBeTruthy();
  });
});
