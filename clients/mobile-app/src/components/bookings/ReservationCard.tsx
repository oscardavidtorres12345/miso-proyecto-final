import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarDays, MapPin, Users } from 'lucide-react-native';
import { t, tCount, getLocale } from '../../i18n';
import { formatDate } from '../../utils/searchFormat';
import { colors, fonts } from '../../theme/colors';

export type ReservationCardData = {
  id: string;
  imageUrl: string;
  accommodationName: string;
  location: string;
  arrival: Date;
  departure: Date;
  guestCount: number;
  showCancel?: boolean;
};

type ReservationCardProps = ReservationCardData & {
  onCancel?: () => void;
};

export function ReservationCard({
  imageUrl,
  accommodationName,
  location,
  arrival,
  departure,
  guestCount,
  showCancel = true,
  onCancel,
}: ReservationCardProps) {
  const lang = getLocale();
  const dateRange = `${formatDate(arrival, lang)} - ${formatDate(departure, lang)}`;
  const guestText = tCount('bookings.guestCount', guestCount);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" testID="reservation-image" accessibilityLabel={accommodationName} />
        </View>
        <View style={styles.body}>
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
            <Text style={styles.metaText}>{guestText}</Text>
          </View>
        </View>
      </View>

      {showCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85} testID="reservation-cancel-btn" accessibilityRole="button" accessibilityLabel={t('bookings.cancelReservation')}>
          <Text style={styles.cancelBtnText}>{t('bookings.cancelReservation')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  imageWrap: {
    width: 120,
    alignSelf: 'stretch',
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 100,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
    gap: 2,
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
  cancelBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
});
