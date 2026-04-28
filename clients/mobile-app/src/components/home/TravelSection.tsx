import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

const mountainImg = require('../../assets/mountain.png');
const seaImg = require('../../assets/sea.png');

export function TravelSection() {
  return (
    <View style={styles.section}>
      <View style={styles.grid}>
        <View style={styles.imagesContainer}>
          <View style={styles.mountainWrapper}>
            <Image source={mountainImg} style={styles.img} resizeMode="cover" />
          </View>
          <View style={styles.seaWrapper}>
            <Image source={seaImg} style={styles.img} resizeMode="cover" />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Explorá el mundo</Text>
          <Text style={styles.heading}>Cada viaje es una historia que contar</Text>
          <Text style={styles.description}>
            Encontrá alojamientos únicos en los destinos más increíbles. Desde montañas hasta playas,
            tu próxima aventura está a un clic de distancia.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  imagesContainer: {
    width: '42%',
    position: 'relative',
    paddingBottom: '18%',
  },
  mountainWrapper: {
    width: '78%',
    aspectRatio: 9 / 14,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  seaWrapper: {
    position: 'absolute',
    width: '55%',
    aspectRatio: 9 / 14,
    borderRadius: 999,
    overflow: 'hidden',
    right: 0,
    bottom: 0,
    zIndex: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.secondary,
    lineHeight: 26,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 22,
  },
});
