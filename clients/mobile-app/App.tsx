import type { SearchNavigationParams } from './src/types/navigation';

import React, { useEffect, useState } from 'react';
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
import { LocaleProvider, useLocale } from './src/context/LocaleContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SplashScreen } from './src/screens/SplashScreen';

type AppScreen = 'home' | 'search' | 'login';
type HeaderConfig = React.ComponentProps<typeof Header>;

const HEADER_CONFIGS = {
  home: { showFlag: true, showLogin: true, showLogo: true },
  search: { showFlag: true, showLogin: true, showLogo: true },
  login: { showFlag: true, showLogo: true },
} satisfies Record<AppScreen, HeaderConfig>;

export function getHeaderConfig(screen: AppScreen): HeaderConfig {
  return HEADER_CONFIGS[screen];
}

interface AppLayoutProps {
  screen: AppScreen;
  searchParams: SearchNavigationParams | null;
  onNavigateToSearch: (params: SearchNavigationParams) => void;
  onNavigateToLogin: () => void;
  onBackToHome: () => void;
}

function AppLayout({
  screen,
  searchParams,
  onNavigateToSearch,
  onNavigateToLogin,
  onBackToHome,
}: AppLayoutProps) {
  const headerConfig = getHeaderConfig(screen);

  return (
    <View style={styles.layout}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <Header
        {...headerConfig}
        onLogoPress={onBackToHome}
        onLoginPress={onNavigateToLogin}
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

function AppContent({
  screen,
  searchParams,
  onNavigateToSearch,
  onNavigateToLogin,
  onBackToHome,
}: AppLayoutProps) {
  const { locale } = useLocale();
  return (
    <AppLayout
      key={locale}
      screen={screen}
      searchParams={searchParams}
      onNavigateToSearch={onNavigateToSearch}
      onNavigateToLogin={onNavigateToLogin}
      onBackToHome={onBackToHome}
    />
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
        <LocaleProvider>
          <AppContent
            screen={screen}
            searchParams={searchParams}
            onNavigateToSearch={handleNavigateToSearch}
            onNavigateToLogin={handleNavigateToLogin}
            onBackToHome={handleBackToHome}
          />
        </LocaleProvider>
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
