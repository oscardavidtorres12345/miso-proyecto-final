import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Header } from './src/components/common/Header';
import { HomeScreen } from './src/screens/HomeScreen';
import { SplashScreen } from './src/screens/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root} testID="app-root">
      <SafeAreaProvider>
        {showSplash ? (
          <SplashScreen />
        ) : (
          <View style={styles.screen}>
            <Header showLogo showFlag showLogin />
            <HomeScreen />
          </View>
        )}
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
});

export default App;
