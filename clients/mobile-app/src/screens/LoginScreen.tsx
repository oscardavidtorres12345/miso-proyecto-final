import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Footer } from '../components/common/Footer';
import { Snackbar } from '../components/common/Snackbar';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../theme/colors';
import { HomeBackground } from '../components/home/HomeBackground';
import { t } from '../i18n';
import { API_CONFIG } from '../config/api';
import { loginUser } from '../services/identityService';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { setAuthData } = useAuth();
  const [contentHeight, setContentHeight] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error';
  }>({ show: false, message: '', variant: 'success' });

  const insets = useSafeAreaInsets();

  const emailError = touched.email
    ? !email.trim()
      ? t('login.fieldRequired')
      : !EMAIL_RE.test(email)
        ? t('login.invalidEmail')
        : null
    : null;

  const passwordError = touched.password && !password ? t('login.fieldRequired') : null;

  const isDisabled = !email.trim() || !EMAIL_RE.test(email) || !password;

  const handleSubmit = async () => {
    setSnackbar(prev => ({ ...prev, show: false }));
    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });

      if (response.user.role === 'STAFF') {
        setSnackbar({ show: true, message: t('login.noPermission'), variant: 'error' });
        return;
      }

      await setAuthData(response);
      setSnackbar({ show: true, message: t('login.apiSuccess'), variant: 'success' });
      setTimeout(onLoginSuccess, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('login.apiError');
      setSnackbar({ show: true, message, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={(_, height) => setContentHeight(height + insets.top)}
        >
          <View style={styles.centeredContent}>
            <HomeBackground contentHeight={contentHeight} />
            <View style={styles.card}>
              <Text style={styles.title}>{t('login.title')}</Text>
              <Text style={styles.subtitle}>
                {t('login.noAccount')}
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL(`${API_CONFIG.WEB_APP_URL}/signup`)}
                  testID="register-link"
                  accessibilityRole="link"
                >
                  {t('login.register')}
                </Text>
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>{t('login.emailLabel')}</Text>
                <View style={[styles.inputBox, emailError ? styles.inputBoxError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="email@mail.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    onBlur={() => setTouched(t => ({ ...t, email: true }))}
                    testID="email-input"
                    accessibilityLabel={t('login.emailLabel')}
                  />
                </View>
                {emailError && (
                  <Text style={styles.errorText} testID="email-error">
                    {emailError}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('login.passwordLabel')}</Text>
                <View style={[styles.inputBox, passwordError ? styles.inputBoxError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    testID="password-input"
                    accessibilityLabel={t('login.passwordLabel')}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(v => !v)}
                    activeOpacity={0.7}
                    testID="toggle-password"
                    accessibilityLabel={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    accessibilityRole="button"
                  >
                    {showPassword
                      ? <EyeOff size={20} color="#9ca3af" />
                      : <Eye size={20} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>
                {passwordError && (
                  <Text style={styles.errorText} testID="password-error">
                    {passwordError}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, (isDisabled || isLoading) ? styles.buttonDisabled : null]}
                disabled={isDisabled || isLoading}
                onPress={handleSubmit}
                activeOpacity={0.85}
                testID="submit-btn"
                accessibilityRole="button"
                accessibilityLabel={t('login.submit')}
                accessibilityState={{ disabled: isDisabled || isLoading }}
              >
                {isLoading
                  ? <ActivityIndicator size="small" color={colors.white} testID="loading-indicator" />
                  : <Text style={styles.buttonText}>{t('login.submit')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Footer style={styles.footer} />

      <Snackbar
        testID="login-snackbar"
        show={snackbar.show}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar(prev => ({ ...prev, show: false }))}
        duration={4000}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    color: colors.secondary,
    marginBottom: 8,
    fontFamily: fonts.bold
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 32,
    fontFamily: fonts.regular
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: colors.secondary,
    marginBottom: 6,
    fontFamily: fonts.bold
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxError: {
    borderColor: '#c62828',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.secondary,
    fontFamily: fonts.regular
  },
  errorText: {
    fontSize: 12,
    color: '#c62828',
    marginTop: 4,
    marginLeft: 5,
    fontFamily: fonts.regular
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.regular
  },
  footer: {
    alignSelf: 'flex-end'
  }
});
