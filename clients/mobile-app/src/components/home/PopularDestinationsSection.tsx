import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '../../i18n';
import { colors } from '../../theme/colors';

const DESTINATIONS = [
  {
    id: 1,
    city: 'Cartagena',
    image: 'https://wallpapercave.com/wp/wp3350882.jpg',
  },
  {
    id: 2,
    city: 'Medellín',
    image:
      'https://t4.ftcdn.net/jpg/03/57/67/49/360_F_357674904_aEjvlRkZ8ZqJa0vSibQQbNiYUuEPv6MM.jpg',
  },
  {
    id: 3,
    city: 'Bogotá',
    image:
      'https://e0.pxfuel.com/wallpapers/588/561/desktop-wallpaper-bogota-bogota-bogota-background-and-bogota-de-noche-bogota.jpg',
  },
  {
    id: 4,
    city: 'Santa Marta',
    image: 'https://e1.pxfuel.com/desktop-wallpaper/562/944/desktop-wallpaper-santa-marta.jpg',
  },
];

export function PopularDestinationsSection() {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>{t('destinations.label')}</Text>
        <Text style={styles.heading}>{t('destinations.heading')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DESTINATIONS.map(({ id, city, image }) => (
          <View key={id} style={styles.card}>
            <Image source={{ uri: image }} style={styles.cardImage} resizeMode="cover" testID={`destination-image-${id}`} accessibilityLabel={city} />
            <Text style={styles.cityName}>{city}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.secondary,
    lineHeight: 28,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  card: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  cityName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    textAlign: 'right',
  },
});
