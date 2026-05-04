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
  getUserConfirmedUpcomingBookings,
  userCancelBooking,
  type ReservationListItemDto,
} from '../services/bookingService';
import { ReservationCard } from '../components/bookings/ReservationCard';
import { HomeBackground } from '../components/home/HomeBackground';
import { Footer } from '../components/common/Footer';
import { ConfirmModal } from '../components/common/Modal';
import { Snackbar } from '../components/common/Snackbar';
import { t } from '../i18n';
import { colors, fonts } from '../theme/colors';

type SnackbarState = { show: boolean; variant: 'success' | 'error'; message: string };

interface Props {
  onNavigateToPastTrips: () => void;
}

export function MyReservationsScreen({ onNavigateToPastTrips }: Props) {
  const { session } = useAuth();
  const [reservations, setReservations] = useState<ReservationListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    show: false,
    variant: 'success',
    message: '',
  });

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    getUserConfirmedUpcomingBookings(String(session.user.user_id))
      .then(data => setReservations(data.reservations))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, [session]);

  const handleCancelConfirm = () => {
    if (!selectedId || !session) return;
    const bookingId = selectedId;
    setSelectedId(null);
    userCancelBooking(bookingId, session.user.user_id)
      .then(() => {
        setReservations(prev => prev.filter(r => r.id !== bookingId));
        setSnackbar({ show: true, variant: 'success', message: t('bookings.cancelSuccess') });
      })
      .catch(() => {
        setSnackbar({ show: true, variant: 'error', message: t('bookings.cancelError') });
      });
  };

  return (
    <View style={styles.container}>
      <HomeBackground contentHeight={contentHeight} />
      <FlatList
        data={loading ? [] : reservations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        ListHeaderComponent={
          <>
            <View style={styles.head}>
              <Text style={styles.title}>{t('bookings.myReservationsTitle')}</Text>
              <TouchableOpacity style={styles.switchBtn} onPress={onNavigateToPastTrips} activeOpacity={0.85}>
                <Text style={styles.switchBtnText}>{t('bookings.switchToPast')}</Text>
              </TouchableOpacity>
            </View>
            {loading && (
              <ActivityIndicator color={colors.primary} style={styles.loader} size="large" />
            )}
            {!loading && reservations.length === 0 && (
              <Text style={styles.empty}>{t('bookings.emptyMessage')}</Text>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <ReservationCard
            {...item}
            arrival={new Date(item.arrival)}
            departure={new Date(item.departure)}
            onCancel={() => setSelectedId(item.id)}
          />
        )}
      />

      <Footer />
      <ConfirmModal
        isOpen={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={t('bookings.cancelReservationModalTitle')}
        message={t('bookings.cancelReservationModalMessage')}
        cancelLabel={t('bookings.cancelReservationModalDismiss')}
        confirmLabel={t('bookings.cancelReservationModalConfirm')}
        onConfirm={handleCancelConfirm}
      />
      <Snackbar
        show={snackbar.show}
        variant={snackbar.variant}
        message={snackbar.message}
        onClose={() => setSnackbar(s => ({ ...s, show: false }))}
      />
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
