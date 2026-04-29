import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import type { SearchNavigationParams } from './src/types/navigation';

type AppScreen = 'home' | 'search';

function App() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_700Bold,
  });
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('home');
  const [searchParams, setSearchParams] = useState<SearchNavigationParams | null>(null);

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
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') applyNavBar();
    });
    return () => sub.remove();
  }, [screen, showSplash]);

  function handleNavigateToSearch(params: SearchNavigationParams) {
    setSearchParams(params);
    setScreen('search');
  }

  function handleBackToHome() {
    setScreen('home');
  }

  if (!fontsLoaded) return null;

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider testID="app-root">
      {screen === 'search' && searchParams ? (
        <SearchScreen params={searchParams} _onBack={handleBackToHome} />
      ) : (
        <HomeScreen onNavigateToSearch={handleNavigateToSearch} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
