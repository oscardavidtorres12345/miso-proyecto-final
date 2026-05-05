import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDown, ChevronUp, Search } from 'lucide-react-native';
import { t } from '../../i18n';
import { colors } from '../../theme/colors';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterGroupProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  withSearch?: boolean;
  pageSize?: number;
  isStars?: boolean;
}

const VISIBLE_STEP = 6;
const SEARCH_MIN = 6;
const DEBOUNCE_MS = 600;

export function clearDebounceTimer(
  timer: ReturnType<typeof setTimeout> | null,
) {
  if (timer) clearTimeout(timer);
}

export function FilterGroup({
  title,
  options,
  selected,
  onChange,
  withSearch = false,
  pageSize = VISIBLE_STEP,
  isStars = false,
}: FilterGroupProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    clearDebounceTimer(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setDebouncedQuery(searchQuery),
      DEBOUNCE_MS,
    );
    return () => {
      clearDebounceTimer(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [debouncedQuery, pageSize]);

  const filtered = debouncedQuery.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(debouncedQuery.toLowerCase()),
      )
    : options;

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const hasLess = visibleCount > pageSize;
  const showSearch = withSearch && options.length > SEARCH_MIN;

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id];
    onChange(next);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.body}>
        {showSearch && (
          <View style={styles.searchRow}>
            <Search size={16} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('filters.searchIn', {
                title: title.toLowerCase(),
              })}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        <View style={styles.options}>
          {visible.map(option => {
            const checked = selected.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={styles.option}
                onPress={() => toggle(option.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.checkbox, checked && styles.checkboxChecked]}
                >
                  {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    isStars && styles.optionLabelStars,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {hasMore && (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() =>
              setVisibleCount(v => Math.min(v + pageSize, filtered.length))
            }
            activeOpacity={0.7}
            testID={`filter-show-more-${title
              .toLowerCase()
              .replace(/\s+/g, '-')}`}
          >
            <Text style={styles.moreBtnText}>{t('filters.showMore')}</Text>
            <ChevronDown size={14} color={colors.primary} />
          </TouchableOpacity>
        )}

        {hasLess && (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() =>
              setVisibleCount(v => Math.max(v - pageSize, pageSize))
            }
            activeOpacity={0.7}
          >
            <Text style={styles.moreBtnText}>{t('filters.showLess')}</Text>
            <ChevronUp size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f7f7f7',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 0,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 24,
    color: '#111',
  },
  body: {
    paddingBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    fontFamily: 'Quicksand_400Regular',
    flex: 1,
    fontSize: 14,
    color: '#111',
    padding: 0,
  },
  options: {
    flexDirection: 'column',
    gap: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },
  checkbox: {
    width: 18,
    minWidth: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
  },
  optionLabel: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
    flexShrink: 1,
  },
  optionLabelStars: {
    fontSize: 20,
    letterSpacing: 2,
    color: '#1a1a1a',
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    marginTop: 8,
  },
  moreBtnText: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 14,
    color: colors.primary,
  },
});
