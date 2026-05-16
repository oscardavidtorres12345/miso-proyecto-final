import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HardHat } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { HomeBackground } from '../components/home/HomeBackground';
import { colors, fonts } from '../theme/colors';

interface AccommodationDetailScreenProps {
  onBack: () => void;
}

export function AccommodationDetailScreen({ onBack }: AccommodationDetailScreenProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <HomeBackground />

      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <HardHat size={64} color={colors.primary} strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>{t('accommodationDetail.underConstructionTitle')}</Text>
          <Text style={styles.subtitle}>{t('accommodationDetail.underConstructionSubtitle')}</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={onBack}
            activeOpacity={0.85}
            testID="detail-back-home-btn"
            accessibilityRole="button"
          >
            <Text style={styles.btnText}>{t('accommodationDetail.backToSearch')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f7e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: fonts.medium,
    color: '#fff',
    fontSize: 15,
  },
});
