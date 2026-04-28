import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeaturesSection } from '../components/home/FeaturesSection';
import { HeroSection } from '../components/home/HeroSection';
import { HomeBackground } from '../components/home/HomeBackground';
import { PopularDestinationsSection } from '../components/home/PopularDestinationsSection';
import { SearchBottomSheet } from '../components/search/SearchBottomSheet';
import { TravelSection } from '../components/home/TravelSection';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [searchOpen, setSearchOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
        onContentSizeChange={(_, height) => setContentHeight(height + insets.top)}
        showsVerticalScrollIndicator={false}
      >
        <HomeBackground contentHeight={contentHeight} />
        <HeroSection onOpenSearch={() => setSearchOpen(true)} />
        <FeaturesSection />
        <PopularDestinationsSection />
        <TravelSection />
      </ScrollView>

      <SearchBottomSheet
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    position: 'relative',
  },
});
