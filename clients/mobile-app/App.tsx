import type { SearchNavigationParams } from './src/types/navigation';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AppState,
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Header } from './src/components/common/Header';
import { Snackbar } from './src/components/common/Snackbar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocaleProvider, useLocale } from './src/context/LocaleContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { t } from './src/i18n';
import { usePushNotifications } from './src/hooks/usePushNotifications';

type AppScreen = 'home' | 'search' | 'login';

type HeaderConfig = React.ComponentProps<typeof Header>;

export function getHeaderConfig(screen: AppScreen, isAuthenticated: boolean): HeaderConfig {
  const showAuthMenu = isAuthenticated && screen !== 'login';
  return {
    showLogo: true,
    showFlag: true,
    showMenu: showAuthMenu,
    showMyBookings: showAuthMenu,
    showLogin: !isAuthenticated && screen !== 'login',
  };
}

interface AppLayoutProps {
  screen: AppScreen;
  searchParams: SearchNavigationParams | null;
  isAuthenticated: boolean;
  username?: string;
  onNavigateToSearch: (params: SearchNavigationParams) => void;
  onNavigateToLogin: () => void;
  onLogoutPress: () => void;
  onBackToHome: () => void;
}

function AppLayout({
  screen,
  searchParams,
  isAuthenticated,
  username,
  onNavigateToSearch,
  onNavigateToLogin,
  onLogoutPress,
  onBackToHome,
}: AppLayoutProps) {
  const headerConfig = getHeaderConfig(screen, isAuthenticated);

  return (
    <View style={styles.layout}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <Header
        {...headerConfig}
        username={username}
        onLogoPress={onBackToHome}
        onLoginPress={onNavigateToLogin}
        onLogoutPress={onLogoutPress}
      />
      {screen === 'login' && <LoginScreen onLoginSuccess={onBackToHome} />}
      {screen === 'search' && searchParams && (
        <SearchScreen params={searchParams} _onBack={onBackToHome} />
      )}
      {screen === 'home' && (
        <HomeScreen onNavigateToSearch={onNavigateToSearch} />
      )}
    </View>
  );
}

type AppContentProps = Omit<AppLayoutProps, 'isAuthenticated' | 'username' | 'onLogoutPress'>;

function AppContent({
  screen,
  searchParams,
  onNavigateToSearch,
  onNavigateToLogin,
  onBackToHome,
}: AppContentProps) {
  const { locale } = useLocale();
  const { session, isAuthenticated, clearAuthData, autoLoggedOut, clearAutoLoggedOut } = useAuth();
  const [showSessionSnackbar, setShowSessionSnackbar] = useState(false);

  const handleDeepLink = useCallback((url: string) => {
    if (url.startsWith('travelhub://my-bookings')) {
      // TODO(front-team): navigate to MyBookingsScreen when ready
      onBackToHome();
    }
  }, [onBackToHome]);

  usePushNotifications(handleDeepLink);

  useEffect(() => {
    if (autoLoggedOut) {
      setShowSessionSnackbar(true);
      clearAutoLoggedOut();
      onBackToHome();
    }
  }, [autoLoggedOut, clearAutoLoggedOut, onBackToHome]);

  const handleLogout = async () => {
    await clearAuthData();
    onBackToHome();
  };

  return (
    <>
      <AppLayout
        key={locale}
        screen={screen}
        searchParams={searchParams}
        isAuthenticated={isAuthenticated}
        username={session?.user.username}
        onNavigateToSearch={onNavigateToSearch}
        onNavigateToLogin={onNavigateToLogin}
        onLogoutPress={handleLogout}
        onBackToHome={onBackToHome}
      />
      <Snackbar
        show={showSessionSnackbar}
        message={t('login.sessionExpired')}
        variant="error"
        onClose={() => setShowSessionSnackbar(false)}
        duration={5000}
      />
    </>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_700Bold,
  });
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('home');
  const [searchParams, setSearchParams] =
    useState<SearchNavigationParams | null>(null);
  const [screenHistory, setScreenHistory] = useState<AppScreen[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const applyNavBar = () => {
      void NavigationBar.setPositionAsync('relative');
      void NavigationBar.setVisibilityAsync('visible');
      void NavigationBar.setButtonStyleAsync('dark');
      NavigationBar.setStyle('dark');
    };
    applyNavBar();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') applyNavBar();
    });
    return () => sub.remove();
  }, [screen, showSplash]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (showSplash) return true;
        if (screenHistory.length === 0) return false;

        const previousScreen = screenHistory[screenHistory.length - 1];
        setScreenHistory(prev => prev.slice(0, -1));
        setScreen(previousScreen);
        return true;
      },
    );

    return () => subscription.remove();
  }, [screenHistory, showSplash]);

  function handleNavigateToSearch(params: SearchNavigationParams) {
    setSearchParams(params);
    setScreenHistory(prev => [...prev, screen]);
    setScreen('search');
  }

  function handleNavigateToLogin() {
    setScreenHistory(prev => [...prev, screen]);
    setScreen('login');
  }

  function handleBackToHome() {
    setScreenHistory([]);
    setScreen('home');
  }

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider testID="app-root">
      {showSplash ? (
        <SplashScreen />
      ) : (
        <AuthProvider>
          <LocaleProvider>
            <AppContent
              screen={screen}
              searchParams={searchParams}
              onNavigateToSearch={handleNavigateToSearch}
              onNavigateToLogin={handleNavigateToLogin}
              onBackToHome={handleBackToHome}
            />
          </LocaleProvider>
        </AuthProvider>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
});

export default App;
