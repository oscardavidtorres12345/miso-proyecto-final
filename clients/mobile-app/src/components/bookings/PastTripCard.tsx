import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CalendarDays, MapPin, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { LocaleCode } from '../../i18n';
import { formatDate } from '../../utils/searchFormat';
import { colors, fonts } from '../../theme/colors';

type PastTripCardProps = {
  imageUrl: string;
  accommodationName: string;
  location: string;
  arrival: Date;
  departure: Date;
  guestCount: number;
};

export function PastTripCard({
  imageUrl,
  accommodationName,
  location,
  arrival,
  departure,
  guestCount,
}: PastTripCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as LocaleCode;
  const dateRange = `${formatDate(arrival, lang)} - ${formatDate(departure, lang)}`;

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" testID="past-trip-image" accessibilityLabel={accommodationName} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{accommodationName}</Text>
        <View style={styles.metaRow}>
          <MapPin size={16} color="#737373" />
          <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
        </View>
        <View style={styles.metaRow}>
          <CalendarDays size={16} color="#737373" />
          <Text style={styles.metaText}>{dateRange}</Text>
        </View>
        <View style={styles.metaRow}>
          <Users size={16} color="#737373" />
          <Text style={styles.metaText}>{t('bookings.guestCount', { count: guestCount })}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: {
    width: 120,
    minWidth: 120,
    alignSelf: 'stretch',
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 80,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.secondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#737373',
    flex: 1,
    lineHeight: 20,
  },
});
