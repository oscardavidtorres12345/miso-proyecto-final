import React, { useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n';
import { colors } from '../../theme/colors';
import { FilterGroup, type FilterOption } from './FilterGroup';
import { PriceFilter, type PriceRange } from './PriceFilter';

export interface FilterOptions {
  services: FilterOption[];
  accommodationTypes: FilterOption[];
  meals: FilterOption[];
  stars: FilterOption[];
}

export interface FiltersState {
  price: PriceRange;
  services: string[];
  accommodationTypes: string[];
  stars: string[];
  meals: string[];
}

interface FilterPanelProps {
  isOpen: boolean;
  filters: FiltersState;
  options: FilterOptions;
  onFiltersChange: (patch: Partial<FiltersState>) => void;
  onCancel: () => void;
  onApply: () => void;
}

export function FilterPanel({
  isOpen,
  filters,
  options,
  onFiltersChange,
  onCancel,
  onApply,
}: FilterPanelProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(width)).current;
  const prevOpen = useRef(false);

  if (prevOpen.current !== isOpen) {
    prevOpen.current = isOpen;
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : width,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View
      style={[
        styles.root,
        { transform: [{ translateX }] },
      ]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
      >
        <Text style={styles.headerTitle}>{t('filters.title')}</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <PriceFilter
          value={filters.price}
          onChange={(price) => onFiltersChange({ price })}
        />

        {options.services.length > 0 && (
          <FilterGroup
            title={t('filters.services')}
            options={options.services}
            selected={filters.services}
            onChange={(services) => onFiltersChange({ services })}
            withSearch
          />
        )}

        {options.accommodationTypes.length > 0 && (
          <FilterGroup
            title={t('filters.accommodationType')}
            options={options.accommodationTypes}
            selected={filters.accommodationTypes}
            onChange={(accommodationTypes) => onFiltersChange({ accommodationTypes })}
            withSearch
          />
        )}

        {options.meals.length > 0 && (
          <FilterGroup
            title={t('filters.meals')}
            options={options.meals}
            selected={filters.meals}
            onChange={(meals) => onFiltersChange({ meals })}
            withSearch
          />
        )}

        {options.stars.length > 0 && (
          <FilterGroup
            title={t('filters.stars')}
            options={options.stars}
            selected={filters.stars}
            onChange={(stars) => onFiltersChange({ stars })}
            isStars
          />
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelText}>{t('filters.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.8}>
          <Text style={styles.applyText}>{t('filters.apply')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  header: {
    height: 56 + 16,
    backgroundColor: colors.secondary,
    justifyContent: 'flex-end',
    paddingHorizontal: 40,
    paddingBottom: 10,
    flexShrink: 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  bodyContent: {
    padding: 22,
    gap: 0,
  },
  footer: {
    flexShrink: 0,
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 22,
    backgroundColor: '#fff',
  },
  cancelBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
