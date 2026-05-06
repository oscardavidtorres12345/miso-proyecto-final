import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  getUserConfirmedUpcomingBookings,
  manualBookingCheckIn,
  scanBookingCheckIn,
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
  const [manualId, setManualId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [contactHint, setContactHint] = useState('');
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

  const handleCheckIn = (bookingId: string) => {
    if (!session) return;
    scanBookingCheckIn(bookingId, session.user.user_id, `mobile-scan:${bookingId}`)
      .then(() => {
        setReservations(prev => prev.filter(r => r.id !== bookingId));
        setSnackbar({ show: true, variant: 'success', message: t('bookings.checkInSuccess') });
      })
      .catch(() => {
        setSnackbar({ show: true, variant: 'error', message: t('bookings.checkInError') });
      });
  };

  const handleManualCheckIn = () => {
    if (!session || !manualId) return;
    if (!documentNumber.trim() || !contactHint.trim()) {
      setSnackbar({ show: true, variant: 'error', message: t('bookings.manualCheckInRequired') });
      return;
    }
    manualBookingCheckIn(manualId, session.user.user_id, {
      document_type: documentType.trim() || 'CC',
      document_number: documentNumber.trim(),
      contact_hint: contactHint.trim(),
    })
      .then(() => {
        setReservations(prev => prev.filter(r => r.id !== manualId));
        setManualId(null);
        setDocumentNumber('');
        setContactHint('');
        setSnackbar({ show: true, variant: 'success', message: t('bookings.checkInSuccess') });
      })
      .catch(() => {
        setSnackbar({ show: true, variant: 'error', message: t('bookings.checkInError') });
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
            onCheckIn={() => handleCheckIn(item.id)}
            onCancel={() => setSelectedId(item.id)}
          />
        )}
      />
      <View style={styles.manualWrap}>
        <TouchableOpacity style={styles.manualBtn} onPress={() => setManualId(reservations[0]?.id ?? null)} activeOpacity={0.85}>
          <Text style={styles.manualBtnText}>{t('bookings.manualCheckInCta')}</Text>
        </TouchableOpacity>
      </View>

      <Footer />
      <Modal visible={manualId !== null} transparent animationType="fade" onRequestClose={() => setManualId(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('bookings.manualCheckInTitle')}</Text>
            <TextInput value={documentType} onChangeText={setDocumentType} style={styles.input} placeholder={t('bookings.manualDocumentType')} />
            <TextInput value={documentNumber} onChangeText={setDocumentNumber} style={styles.input} placeholder={t('bookings.manualDocumentNumber')} />
            <TextInput value={contactHint} onChangeText={setContactHint} style={styles.input} placeholder={t('bookings.manualContactHint')} />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setManualId(null)}><Text style={styles.secondaryBtnText}>{t('bookings.cancelReservationModalDismiss')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleManualCheckIn}><Text style={styles.primaryBtnText}>{t('bookings.manualCheckInConfirm')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  manualWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  manualBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 999,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBtnText: {
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  dialogTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: colors.primary, fontFamily: fonts.medium },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: colors.white, fontFamily: fonts.medium },
});
