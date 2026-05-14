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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ChevronDown } from 'lucide-react-native';
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
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../theme/colors';

type SnackbarState = { show: boolean; variant: 'success' | 'error'; message: string };

const DOCUMENT_TYPE_API: Record<string, string> = { cc: 'CC', passport: 'PASSPORT' };
const DOCUMENT_NUMBER_RE = /[^a-zA-Z0-9]/g;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  onNavigateToPastTrips: () => void;
}

export function MyReservationsScreen({ onNavigateToPastTrips }: Props) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [reservations, setReservations] = useState<ReservationListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('cc');
  const [documentTypeOpen, setDocumentTypeOpen] = useState(false);
  const [documentNumber, setDocumentNumber] = useState('');
  const [contactHint, setContactHint] = useState('');
  const [contentHeight, setContentHeight] = useState(0);
  const [scanBookingId, setScanBookingId] = useState<string | null>(null);
  const [isVerifyingQr, setIsVerifyingQr] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCancelling, setIsCancelling] = useState(false);
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
    setIsCancelling(true);
    userCancelBooking(bookingId, session.user.user_id)
      .then(() => {
        setReservations(prev => prev.filter(r => r.id !== bookingId));
        setSnackbar({ show: true, variant: 'success', message: t('bookings.cancelSuccess') });
      })
      .catch(() => {
        setSnackbar({ show: true, variant: 'error', message: t('bookings.cancelError') });
      })
      .finally(() => {
        setIsCancelling(false);
      });
  };

  const submitQrCheckIn = async (bookingId: string, qrValue: string) => {
    if (!session) return;
    setIsVerifyingQr(true);
    const verifyStart = Date.now();
    let checkInOk = false;
    try {
      await scanBookingCheckIn(bookingId, session.user.user_id, qrValue);
      setReservations(prev =>
        prev.map(r =>
          r.id === bookingId ? { ...r, showCheckIn: false, showCancel: false } : r,
        ),
      );
      checkInOk = true;
    } catch {
      checkInOk = false;
    } finally {
      const elapsed = Date.now() - verifyStart;
      const minVisibleMs = 2500;
      if (elapsed < minVisibleMs) {
        await new Promise<void>(resolve => setTimeout(resolve, minVisibleMs - elapsed));
      }
      setIsVerifyingQr(false);
    }
    setSnackbar({
      show: true,
      variant: checkInOk ? 'success' : 'error',
      message: checkInOk ? t('bookings.checkInSuccess') : t('bookings.checkInError'),
    });
  };

  const handleCheckIn = async (bookingId: string) => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        setSnackbar({ show: true, variant: 'error', message: t('bookings.cameraPermissionRequired') });
        return;
      }
    }
    setScanBookingId(bookingId);
  };

  const isManualCheckInDisabled =
    !documentNumber.trim() || !EMAIL_RE.test(contactHint.trim());

  const handleManualCheckIn = () => {
    if (!session || !manualId) return;
    if (!documentNumber.trim() || !contactHint.trim()) {
      setSnackbar({ show: true, variant: 'error', message: t('bookings.manualCheckInRequired') });
      return;
    }
    if (!EMAIL_RE.test(contactHint.trim())) {
      setSnackbar({ show: true, variant: 'error', message: t('bookings.manualInvalidEmail') });
      return;
    }
    manualBookingCheckIn(manualId, session.user.user_id, {
      document_type: DOCUMENT_TYPE_API[documentType] ?? 'CC',
      document_number: documentNumber.trim(),
      contact_hint: contactHint.trim(),
    })
      .then(() => {
        setReservations(prev =>
          prev.map(r =>
            r.id === manualId ? { ...r, showCheckIn: false, showCancel: false } : r,
          ),
        );
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
              <Text style={styles.title} testID="my-reservations-title">
                {t('bookings.myReservationsTitle')}
              </Text>
              <TouchableOpacity style={styles.switchBtn} onPress={onNavigateToPastTrips} activeOpacity={0.85} testID="switch-to-past-trips-btn" accessibilityRole="button" accessibilityLabel={t('bookings.switchToPast')}>
                <Text style={styles.switchBtnText}>{t('bookings.switchToPast')}</Text>
              </TouchableOpacity>
            </View>
            {loading && (
              <ActivityIndicator color={colors.primary} style={styles.loader} size="large" />
            )}
            {!loading && reservations.length === 0 && (
              <Text style={styles.empty} testID="my-reservations-empty-message">
                {t('bookings.emptyMessage')}
              </Text>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <ReservationCard
            {...item}
            arrival={new Date(item.arrival)}
            departure={new Date(item.departure)}
            showCheckIn={item.showCheckIn ?? true}
            onCheckIn={() => handleCheckIn(item.id)}
            onManualCheckIn={() => setManualId(item.id)}
            onCancel={() => setSelectedId(item.id)}
          />
        )}
      />

      <Footer />

      <Modal visible={scanBookingId !== null} transparent animationType="slide" onRequestClose={() => setScanBookingId(null)}>
        <View style={styles.scannerWrap}>
          <Text style={styles.scannerTitle}>{t('bookings.scanQrTitle')}</Text>
          <Text style={styles.scannerHint}>{t('bookings.scanQrHint')}</Text>
          <View style={styles.cameraBox}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanBookingId && !isVerifyingQr ? ({ data }) => {
                const bookingId = scanBookingId;
                setScanBookingId(null);
                submitQrCheckIn(bookingId, data);
              } : undefined}
            />
          </View>
          <TouchableOpacity style={styles.scannerCloseBtn} onPress={() => setScanBookingId(null)}>
            <Text style={styles.scannerCloseBtnText}>{t('bookings.closeScanner')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={isVerifyingQr} transparent animationType="fade">
        <View style={styles.verifyOverlay}>
          <View style={styles.verifyDialog}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.verifyText}>Verificando QR...</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={isCancelling} transparent animationType="fade">
        <View style={styles.verifyOverlay}>
          <ActivityIndicator color={colors.secondary} size="large" testID="cancel-loading-spinner" />
        </View>
      </Modal>
      
      <Modal visible={manualId !== null} transparent animationType="fade" onRequestClose={() => setManualId(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('bookings.manualCheckInTitle')}</Text>
            <Text style={styles.bookingRefText}>
              {t('bookings.bookingIdLabel')}: {manualId}
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t('bookings.manualDocumentType')}</Text>
              <TouchableOpacity
                style={styles.inputBox}
                onPress={() => setDocumentTypeOpen(true)}
                activeOpacity={0.8}
                testID="manual-checkin-document-type-trigger"
                accessibilityRole="button"
                accessibilityLabel={t('bookings.manualDocumentType')}
              >
                <Text style={styles.selectValue}>
                  {documentType === 'passport'
                    ? t('bookings.documentTypePassport')
                    : t('bookings.documentTypeCC')}
                </Text>
                <ChevronDown size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('bookings.manualDocumentNumber')}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  testID="manual-checkin-document-number-input"
                  value={documentNumber}
                  onChangeText={text => setDocumentNumber(text.replace(DOCUMENT_NUMBER_RE, ''))}
                  style={styles.input}
                  placeholder={t('bookings.manualDocumentNumberPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('bookings.manualContactHint')}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  testID="manual-checkin-contact-hint-input"
                  value={contactHint}
                  onChangeText={setContactHint}
                  style={styles.input}
                  placeholder={t('bookings.manualContactHintPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setManualId(null)}><Text style={styles.secondaryBtnText}>{t('bookings.cancelReservationModalDismiss')}</Text></TouchableOpacity>
              <TouchableOpacity
                testID="manual-checkin-confirm-btn"
                style={[styles.primaryBtn, isManualCheckInDisabled && styles.primaryBtnDisabled]}
                disabled={isManualCheckInDisabled}
                onPress={handleManualCheckIn}
                accessibilityState={{ disabled: isManualCheckInDisabled }}
              >
                <Text style={styles.primaryBtnText}>{t('bookings.manualCheckInConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {documentTypeOpen && (
            <TouchableOpacity style={styles.selectOverlay} activeOpacity={1} onPress={() => setDocumentTypeOpen(false)}>
              <View style={styles.selectSheet}>
                {[
                  { value: 'cc', label: t('bookings.documentTypeCC') },
                  { value: 'passport', label: t('bookings.documentTypePassport') },
                ].map(opt => {
                  const selected = opt.value === documentType;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.selectOption, selected && styles.selectOptionSelected]}
                      onPress={() => {
                        setDocumentType(opt.value);
                        setDocumentTypeOpen(false);
                      }}
                      testID={`manual-checkin-document-type-option-${opt.value}`}
                    >
                      <Text style={[styles.selectOptionText, selected && styles.selectOptionTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
      <ConfirmModal
        isOpen={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={t('bookings.cancelReservationModalTitle')}
        message={t('bookings.cancelReservationModalMessage')}
        cancelLabel={t('bookings.cancelReservationModalDismiss')}
        confirmLabel={t('bookings.cancelReservationModalConfirm')}
        closeLabel={t('common.close')}
        onConfirm={handleCancelConfirm}
      />
      <Snackbar
        testID="bookings-feedback-snackbar"
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
  bookingRefText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#6f6f6f',
  },
  field: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 6,
    fontFamily: fonts.bold,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.secondary,
  },
  selectValue: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.secondary,
  },
  selectOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  selectSheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  selectOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  selectOptionSelected: {
    backgroundColor: 'rgba(125,161,13,0.08)',
  },
  selectOptionText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
  },
  selectOptionTextSelected: {
    fontFamily: fonts.bold,
    color: colors.primary,
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
  primaryBtnDisabled: { opacity: 0.4 },
  scannerWrap: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  scannerTitle: { color: colors.white, fontSize: 20, fontFamily: fonts.bold },
  scannerHint: { color: colors.white, fontSize: 14, fontFamily: fonts.regular },
  cameraBox: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  camera: { flex: 1 },
  scannerCloseBtn: {
    alignSelf: 'center',
    backgroundColor: '#ffffff22',
    borderRadius: 999,
    height: 34,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scannerCloseBtnText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  verifyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  verifyDialog: {
    width: '100%',
    maxWidth: 260,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  verifyText: {
    color: colors.secondary,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
});
