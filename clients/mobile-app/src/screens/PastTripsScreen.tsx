import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  getUserConfirmedPastBookings,
  type ReservationListItemDto,
} from '../services/bookingService';
import { PastTripCard } from '../components/bookings/PastTripCard';
import { HomeBackground } from '../components/home/HomeBackground';
import { Footer } from '../components/common/Footer';
import { t } from '../i18n';
import { colors, fonts } from '../theme/colors';

interface Props {
  onNavigateToReservations: () => void;
}

export function PastTripsScreen({ onNavigateToReservations }: Props) {
  const { session } = useAuth();
  const [trips, setTrips] = useState<ReservationListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    getUserConfirmedPastBookings(String(session.user.user_id))
      .then(data => setTrips(data.reservations))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <View style={styles.container}>
      <HomeBackground contentHeight={contentHeight} />
      <FlatList
        data={loading ? [] : trips}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        ListHeaderComponent={
          <>
            <View style={styles.head}>
              <Text style={styles.title}>{t('bookings.pastTripsTitle')}</Text>
              <TouchableOpacity style={styles.switchBtn} onPress={onNavigateToReservations} activeOpacity={0.85}>
                <Text style={styles.switchBtnText}>{t('bookings.switchToCurrent')}</Text>
              </TouchableOpacity>
            </View>
            {loading && (
              <ActivityIndicator color={colors.primary} style={styles.loader} size="large" />
            )}
            {!loading && trips.length === 0 && (
              <Text style={styles.empty}>{t('bookings.emptyMessage')}</Text>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <PastTripCard
            {...item}
            arrival={new Date(item.arrival)}
            departure={new Date(item.departure)}
          />
        )}
      />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.secondary,
    flexShrink: 1,
    marginRight: 12,
  },
  switchBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  switchBtnText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.secondary,
    paddingHorizontal: 12,
    marginTop: 60,
  },
  separator: {
    height: 16,
  },
});
