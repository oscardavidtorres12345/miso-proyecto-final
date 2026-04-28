import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../../theme/colors';

const coverImage = require('../../assets/cover_image.png');

interface Props {
  onOpenSearch: () => void;
}

export function HeroSection({ onOpenSearch }: Props) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroGrid}>
        <View style={styles.heroContent}>
          <Text style={styles.heroSubtitle}>Descubre tus próximas vacaciones</Text>
          <Text style={styles.heroTitle}>La vida es corta y el mundo es gigante.</Text>
          <TouchableOpacity style={styles.searchButton} onPress={onOpenSearch} activeOpacity={0.85}>
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroImageColumn}>
          <View style={styles.heroImageContainer}>
            <Image source={coverImage} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroContent: {
    flex: 1,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.secondary,
    lineHeight: 28,
    marginBottom: 20,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroImageColumn: {
    width: '38%',
  },
  heroImageContainer: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    aspectRatio: 435 / 688,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
});
