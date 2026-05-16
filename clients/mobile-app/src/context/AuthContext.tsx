import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoginResponse } from '../types/api';

const STORAGE_KEY = 'travel-hub-auth';

export interface AuthUser {
  user_id: number;
  username: string;
  email: string;
  role: 'GUEST' | 'STAFF';
  is_active: boolean;
  document_type?: string | null;
  document_id?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  permissions: string[];
  sessionExpiresAt: string;
  token: string | null;
}

interface AuthContextValue {
  session: AuthSession | null;
  token: string | null;
  isAuthenticated: boolean;
  autoLoggedOut: boolean;
  setAuthData: (response: LoginResponse) => Promise<void>;
  clearAuthData: () => Promise<void>;
  clearAutoLoggedOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [autoLoggedOut, setAutoLoggedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session from AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!isMounted || !raw) return;
      try {
        const parsed: AuthSession = JSON.parse(raw);
        const expiresAt = new Date(parsed.sessionExpiresAt).getTime();
        if (expiresAt <= Date.now()) {
          void AsyncStorage.removeItem(STORAGE_KEY);
        } else {
          setSession(parsed);
        }
      } catch {
        void AsyncStorage.removeItem(STORAGE_KEY);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Auto-logout timer — fires when the session expires
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!session) return;

    const msUntilExpiry = new Date(session.sessionExpiresAt).getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      void AsyncStorage.removeItem(STORAGE_KEY);
      setSession(null);
      setAutoLoggedOut(true);
      return;
    }

    timerRef.current = setTimeout(() => {
      void AsyncStorage.removeItem(STORAGE_KEY);
      setSession(null);
      setAutoLoggedOut(true);
    }, msUntilExpiry);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session]);

  const setAuthData = useCallback(async (response: LoginResponse) => {
    const newSession: AuthSession = {
      user: response.user,
      permissions: response.permissions,
      sessionExpiresAt: response.session_expires_at,
      token: response.access_token ?? null,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const clearAuthData = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const clearAutoLoggedOut = useCallback(() => setAutoLoggedOut(false), []);

  return (
    <AuthContext.Provider
      value={{
        session,
        token: session?.token ?? null,
        isAuthenticated: session !== null,
        autoLoggedOut,
        setAuthData,
        clearAuthData,
        clearAutoLoggedOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
