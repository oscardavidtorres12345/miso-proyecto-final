import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { t } from '../../i18n';
import { colors } from '../../theme/colors';
import { formatDateRangeLabel, formatGuestsLabel } from '../../utils/searchFormat';
import type { SearchNavigationParams } from '../../types/navigation';

interface SearchSummaryBarProps {
  params: SearchNavigationParams;
  onEditSearch: () => void;
}

export function SearchSummaryBar({ params, onEditSearch }: SearchSummaryBarProps) {
  const dateText =
    params.checkIn && params.checkOut
      ? formatDateRangeLabel(params.checkIn, params.checkOut)
      : t('search.addDates');
  const guestsText = formatGuestsLabel(params.adults, params.children);

  return (
    <TouchableOpacity style={styles.summary} onPress={onEditSearch} activeOpacity={0.75}>
      <Search size={26} color={colors.secondary} style={styles.icon} />
      <View style={styles.copy}>
        <Text style={styles.destination} numberOfLines={1}>
          {params.destination || t('search.destination')}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {dateText} · {guestsText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  icon: {
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  destination: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 20,
    color: colors.secondary,
    lineHeight: 22,
  },
  meta: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 14,
    color: '#737373',
    lineHeight: 17,
  },
});
