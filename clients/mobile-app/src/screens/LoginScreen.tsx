import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../theme/colors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = touched.email
    ? !email.trim()
      ? 'Campo requerido'
      : !EMAIL_RE.test(email)
        ? 'Correo inválido'
        : null
    : null;

  const passwordError = touched.password && !password ? 'Campo requerido' : null;

  const isDisabled = !email.trim() || !EMAIL_RE.test(email) || !password;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Inicia sesión en tu cuenta</Text>
          <Text style={styles.subtitle}>
            {'¿No tienes cuenta? '}
            <Text style={styles.link}>Regístrate</Text>
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Correo</Text>
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
              />
            </View>
            {emailError && (
              <Text style={styles.errorText} testID="email-error">
                {emailError}
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
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
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                activeOpacity={0.7}
                testID="toggle-password"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
            style={[styles.button, isDisabled ? styles.buttonDisabled : null]}
            disabled={isDisabled}
            activeOpacity={0.85}
            testID="submit-btn"
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
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
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 32,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.secondary,
    marginBottom: 6,
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
  },
  errorText: {
    fontSize: 12,
    color: '#c62828',
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
