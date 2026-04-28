import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { Calendar as RangeCalendar, LocaleConfig, type DateData } from 'react-native-calendars';

import { getSearchProperties } from '../../services/searchService';
import { colors } from '../../theme/colors';
import type { SearchPropertiesResponse } from '../../types/api';

type SheetView = 'main' | 'dates' | 'guests';

interface Guests {
  adults: number;
  children: number;
  rooms: number;
  pets: boolean;
}

const GUESTS_DEFAULT: Guests = { adults: 1, children: 0, rooms: 1, pets: false };
const PANEL_OFFSCREEN = 600;
const DAY_MS = 24 * 60 * 60 * 1000;

LocaleConfig.locales.es = {
  monthNames: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  dayNames: ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
  dayNamesShort: ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sa'],
  today: 'hoy',
};
LocaleConfig.defaultLocale = 'es';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSearchResults?: (results: SearchPropertiesResponse) => void;
}

export function SearchBottomSheet({ isOpen, onClose, onSearchResults }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(PANEL_OFFSCREEN)).current;
  const subViewX = useRef(new Animated.Value(width)).current;

  const [isVisible, setIsVisible] = useState(false);

  const viewRef = useRef<SheetView>('main');
  const [view, setViewState] = useState<SheetView>('main');
  function setView(v: SheetView) {
    viewRef.current = v;
    setViewState(v);
  }

  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState<Guests>(GUESTS_DEFAULT);
  const [guestsSelected, setGuestsSelected] = useState(false);

  const [tempCheckIn, setTempCheckIn] = useState('');
  const [tempCheckOut, setTempCheckOut] = useState('');
  const [tempGuests, setTempGuests] = useState<Guests>(GUESTS_DEFAULT);

  const [loading, setLoading] = useState(false);

  const canSearch =
    destination.trim().length > 0 &&
    checkIn.length > 0 &&
    checkOut.length > 0 &&
    guestsSelected;

  const guestDisplay = guestsSelected
    ? `${guests.adults + guests.children} huésped${guests.adults + guests.children !== 1 ? 'es' : ''}`
    : null;

  const dateDisplay = checkIn && checkOut ? formatDateRangeLabel(checkIn, checkOut) : null;
  const markedDates = buildMarkedDates(tempCheckIn, tempCheckOut);

  const animateOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(panelY, {
        toValue: 0,
        damping: 22,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, panelY]);

  const animateClose = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(panelY, {
        toValue: PANEL_OFFSCREEN,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => callback?.());
  }, [overlayOpacity, panelY]);

  useEffect(() => {
    if (isOpen) {
      panelY.setValue(PANEL_OFFSCREEN);
      overlayOpacity.setValue(0);
      setView('main');
      setIsVisible(true);
    } else {
      animateClose(() => setIsVisible(false));
    }
  }, [animateClose, isOpen, overlayOpacity, panelY]);

  useEffect(() => {
    if (view === 'main') return;
    subViewX.setValue(width);
    Animated.timing(subViewX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [subViewX, view, width]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => viewRef.current === 'main',
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8 && viewRef.current === 'main',
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) panelY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          animateClose(() => onClose());
        } else {
          Animated.spring(panelY, {
            toValue: 0,
            damping: 22,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  function handleOverlayPress() {
    animateClose(() => onClose());
  }

  function openDates() {
    setTempCheckIn(checkIn);
    setTempCheckOut(checkOut);
    setView('dates');
  }

  function applyDates() {
    setCheckIn(tempCheckIn);
    setCheckOut(tempCheckOut);
    setView('main');
  }

  function openGuests() {
    setTempGuests({ ...guests });
    setView('guests');
  }

  function applyGuests() {
    setGuests({ ...tempGuests });
    setGuestsSelected(true);
    setView('main');
  }

  function onDateDayPress(day: DateData) {
    const selected = day.dateString;
    if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
      setTempCheckIn(selected);
      setTempCheckOut('');
      return;
    }
    if (selected <= tempCheckIn) {
      setTempCheckIn(selected);
      setTempCheckOut('');
      return;
    }
    setTempCheckOut(selected);
  }

  async function handleSearch() {
    if (!canSearch) return;
    setLoading(true);
    try {
      const results = await getSearchProperties({
        destination: destination.trim(),
        checkIn,
        checkOut,
        adults: guests.adults,
        children: guests.children,
        rooms: guests.rooms,
        pets: guests.pets,
      });
      animateClose(() => {
        setIsVisible(false);
        onClose();
        onSearchResults?.(results);
      });
    } catch {
      Alert.alert('Error', 'No se pudo realizar la búsqueda. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onShow={animateOpen}
      onRequestClose={handleOverlayPress}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.panel,
          insets.bottom > 0 ? styles.panelWithInset : styles.panelWithoutInset,
          { transform: [{ translateY: panelY }] },
        ]}
      >
        <View {...(view === 'main' ? panResponder.panHandlers : {})} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {view === 'main' && (
          <View style={styles.sheetContent}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Destino</Text>
              <View style={styles.fieldRow}>
                <MapPin size={20} color={colors.primary} style={styles.fieldIcon} />
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.fieldTextInput}
                    placeholder="¿Adónde vas?"
                    placeholderTextColor="#9ca3af"
                    value={destination}
                    onChangeText={setDestination}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.field} onPress={openDates} activeOpacity={0.75}>
              <Text style={styles.fieldLabel}>Fechas</Text>
              <View style={styles.fieldRow}>
                <Calendar size={20} color={colors.primary} style={styles.fieldIcon} />
                <View style={styles.inputBox}>
                  <Text style={[styles.fieldDisplayText, !dateDisplay && styles.fieldPlaceholderText]}>
                    {dateDisplay ?? 'Agrega fechas'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.field} onPress={openGuests} activeOpacity={0.75}>
              <Text style={styles.fieldLabel}>Quién</Text>
              <View style={styles.fieldRow}>
                <Users size={20} color={colors.primary} style={styles.fieldIcon} />
                <View style={styles.inputBox}>
                  <Text style={[styles.fieldDisplayText, !guestDisplay && styles.fieldPlaceholderText]}>
                    {guestDisplay ?? '¿Cuántos?'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <TouchableOpacity
                style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
                onPress={handleSearch}
                disabled={!canSearch}
                activeOpacity={0.85}
              >
                <Text style={styles.searchBtnText}>Buscar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>

      {view !== 'main' && (
        <Animated.View style={[styles.subViewScreen, { transform: [{ translateX: subViewX }] }]}>
          <View style={[styles.subHeader, insets.top > 0 ? styles.subHeaderWithInset : styles.subHeaderNoInset]}>
            <Text style={styles.subHeaderTitle}>{view === 'dates' ? 'Fechas' : 'Quién'}</Text>
          </View>

          <View style={[styles.subBody, view === 'guests' && styles.subBodyGuests]}>
            {view === 'dates' ? (
              <RangeCalendar
                current={tempCheckIn || todayIso()}
                minDate={todayIso()}
                onDayPress={onDateDayPress}
                markedDates={markedDates}
                markingType="custom"
                renderArrow={(direction) => (
                  <Text style={styles.calendarArrow}>{direction === 'left' ? '‹' : '›'}</Text>
                )}
                theme={{
                  selectedDayBackgroundColor: colors.primary,
                  todayTextColor: colors.primary,
                  arrowColor: colors.primary,
                  textDayFontWeight: '500',
                }}
              />
            ) : (
              <View>
                <CounterRow
                  label="Adultos"
                  subLabel="Edad: 13 años o más"
                  value={tempGuests.adults}
                  min={1}
                  onIncrement={() => setTempGuests((g) => ({ ...g, adults: g.adults + 1 }))}
                  onDecrement={() =>
                    setTempGuests((g) => ({ ...g, adults: Math.max(1, g.adults - 1) }))
                  }
                />
                <CounterRow
                  label="Niños"
                  subLabel="Edad: 0 a 12 años"
                  value={tempGuests.children}
                  min={0}
                  onIncrement={() => setTempGuests((g) => ({ ...g, children: g.children + 1 }))}
                  onDecrement={() =>
                    setTempGuests((g) => ({ ...g, children: Math.max(0, g.children - 1) }))
                  }
                />
                <CounterRow
                  label="Habitaciones"
                  value={tempGuests.rooms}
                  min={1}
                  onIncrement={() => setTempGuests((g) => ({ ...g, rooms: g.rooms + 1 }))}
                  onDecrement={() =>
                    setTempGuests((g) => ({ ...g, rooms: Math.max(1, g.rooms - 1) }))
                  }
                />
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Mascotas</Text>
                  <Switch
                    value={tempGuests.pets}
                    onValueChange={(val) => setTempGuests((g) => ({ ...g, pets: val }))}
                    trackColor={{ false: '#d1d5db', true: '#bdd169' }}
                    thumbColor={tempGuests.pets ? colors.primary : '#f4f4f4'}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={[styles.subFooter, insets.bottom > 0 ? styles.subFooterWithInset : styles.subFooterNoInset]}>
            <TouchableOpacity style={styles.subCancelBtn} onPress={() => setView('main')}>
              <Text style={styles.subCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subApplyBtn}
              onPress={view === 'dates' ? applyDates : applyGuests}
            >
              <Text style={styles.subApplyText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </Modal>
  );
}

interface CounterRowProps {
  label: string;
  subLabel?: string;
  value: number;
  min: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function CounterRow({ label, subLabel, value, min, onIncrement, onDecrement }: CounterRowProps) {
  return (
    <View style={counter.row}>
      <View>
        <Text style={counter.label}>{label}</Text>
        {subLabel ? <Text style={counter.subLabel}>{subLabel}</Text> : null}
      </View>
      <View style={counter.controls}>
        <TouchableOpacity
          style={[counter.btn, value <= min && counter.btnDisabled]}
          onPress={onDecrement}
          disabled={value <= min}
        >
          <Text style={[counter.btnText, value <= min && counter.btnTextDisabled]}>−</Text>
        </TouchableOpacity>
        <Text style={counter.value}>{value}</Text>
        <TouchableOpacity style={counter.btn} onPress={onIncrement}>
          <Text style={counter.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  panelWithInset: {
    paddingBottom: 12,
  },
  panelWithoutInset: {
    paddingBottom: 4,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  sheetContent: {
    padding: 20,
    gap: 12,
  },
  field: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
    color: '#111',
    marginBottom: 2,
    marginLeft: 22,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  fieldIcon: {
    width: 24,
  },
  fieldTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    paddingVertical: 0,
    lineHeight: 20,
  },
  fieldDisplayText: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    paddingVertical: 0,
    lineHeight: 20,
  },
  fieldPlaceholderText: {
    color: '#9ca3af',
  },
  loader: {
    marginVertical: 14,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  searchBtnDisabled: {
    opacity: 0.45,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subViewScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 20,
  },
  subHeader: {
    backgroundColor: colors.secondary,
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  subHeaderWithInset: {
    paddingTop: 12,
  },
  subHeaderNoInset: {
    paddingTop: 8,
  },
  subHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  subBody: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 22,
  },
  subBodyGuests: {
    paddingTop: 0,
  },
  calendarArrow: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 28,
    marginHorizontal: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  subFooter: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  subFooterWithInset: {
    paddingBottom: 12,
  },
  subFooterNoInset: {
    paddingBottom: 4,
  },
  subCancelBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subCancelText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  subApplyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subApplyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

function formatDateRangeLabel(checkIn: string, checkOut: string) {
  const from = safeDate(checkIn);
  const to = safeDate(checkOut);
  if (!from || !to) return `${checkIn} - ${checkOut}`;
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const locale = 'es-CO';
  return `${new Intl.DateTimeFormat(locale, options).format(from)} - ${new Intl.DateTimeFormat(
    locale,
    options,
  ).format(to)}`;
}

function safeDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function buildMarkedDates(start: string, end: string) {
  if (!start) return {};
  if (!end || end <= start) {
    return {
      [start]: {
        customStyles: {
          container: {
            backgroundColor: colors.primary,
            borderRadius: 999,
          },
          text: {
            color: '#fff',
            fontWeight: '600',
          },
        },
      },
    };
  }

  const marks: Record<string, { customStyles: { container: object; text: object } }> = {};
  const startDate = new Date(start);
  const endDate = new Date(end);

  for (let d = startDate; d <= endDate; d = new Date(d.getTime() + DAY_MS)) {
    const key = d.toISOString().split('T')[0];
    if (key === start) {
      marks[key] = {
        customStyles: {
          container: {
            backgroundColor: colors.primary,
            borderRadius: 999,
          },
          text: {
            color: '#fff',
            fontWeight: '600',
          },
        },
      };
    } else if (key === end) {
      marks[key] = {
        customStyles: {
          container: {
            backgroundColor: colors.primary,
            borderRadius: 999,
          },
          text: {
            color: '#fff',
            fontWeight: '600',
          },
        },
      };
    } else {
      marks[key] = {
        customStyles: {
          container: {
            backgroundColor: 'rgba(125, 161, 13, 0.12)',
            borderRadius: 6,
          },
          text: {
            color: '#1f2937',
            fontWeight: '500',
          },
        },
      };
    }
  }

  return marks;
}

const counter = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  subLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  btn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    borderColor: '#e5e7eb',
  },
  btnText: {
    fontSize: 18,
    color: '#374151',
    lineHeight: 22,
  },
  btnTextDisabled: {
    color: '#d1d5db',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 22,
    textAlign: 'center',
    color: '#111',
  },
});
