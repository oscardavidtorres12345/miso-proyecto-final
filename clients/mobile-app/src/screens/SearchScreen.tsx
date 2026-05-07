import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AccommodationCard } from '../components/search/AccommodationCard';
import { FilterPanel, type FilterOptions, type FiltersState } from '../components/search/FilterPanel';
import { HomeBackground } from '../components/home/HomeBackground';
import { Pagination } from '../components/search/Pagination';
import { SearchSummaryBar } from '../components/search/SearchSummaryBar';
import { SearchBottomSheet } from '../components/search/SearchBottomSheet';
import { t } from '../i18n';
import { getSearchFilters, getSearchProperties } from '../services/searchService';
import { colors } from '../theme/colors';
import type { Accommodation, SearchFiltersResponse } from '../types/api';
import type { SearchNavigationParams } from '../types/navigation';

const PAGE_SIZE = 10;
const PRICE_DEBOUNCE_MS = 2000;

interface PriceRange {
  min: string;
  max: string;
}

const EMPTY_FILTERS: FiltersState = {
  price: { min: '', max: '' },
  services: [],
  accommodationTypes: [],
  stars: [],
  meals: [],
};

const EMPTY_API_FILTERS: SearchFiltersResponse = {
  amenities: [],
  accommodationTypes: [],
  meals: [],
  stars: [],
};

export function cloneFilters(f: FiltersState): FiltersState {
  return {
    price: { ...f.price },
    services: [...f.services],
    accommodationTypes: [...f.accommodationTypes],
    stars: [...f.stars],
    meals: [...f.meals],
  };
}

export function hasActive(f: FiltersState): boolean {
  return (
    f.price.min.trim() !== '' ||
    f.price.max.trim() !== '' ||
    f.services.length > 0 ||
    f.accommodationTypes.length > 0 ||
    f.stars.length > 0 ||
    f.meals.length > 0
  );
}

export function buildFilterOptions(api: SearchFiltersResponse): FilterOptions {
  const rawServices: Array<{ id: string; name?: string }> = getRawServices(api);
  const rawTypes: Array<{ id: string; name?: string }> = getRawTypes(api);
  const rawMeals: Array<{ id: string; name?: string }> = getRawMeals(api);
  const rawStars: Array<number | { id: string }> = getRawStars(api);

  return {
    services: rawServices.map(({ id, name }) => ({
      id,
      label: t(`filters.service.${id.toLowerCase()}`) === `filters.service.${id.toLowerCase()}`
        ? (name ?? id)
        : t(`filters.service.${id.toLowerCase()}`),
    })),
    accommodationTypes: rawTypes.map(({ id, name }) => ({
      id,
      label: t(`filters.accommodation.${id.toLowerCase()}`) === `filters.accommodation.${id.toLowerCase()}`
        ? (name ?? id)
        : t(`filters.accommodation.${id.toLowerCase()}`),
    })),
    meals: rawMeals.map(({ id, name }) => ({
      id,
      label: t(`filters.meal.${id.toLowerCase()}`) === `filters.meal.${id.toLowerCase()}`
        ? (name ?? id)
        : t(`filters.meal.${id.toLowerCase()}`),
    })),
    stars: rawStars.map((s) => {
      const id = typeof s === 'object' ? String((s as { id: string }).id) : String(s);
      const n = Number(id);
      return { id, label: '★'.repeat(Number.isFinite(n) ? n : 0) };
    }),
  };
}

export function getRawServices(api: SearchFiltersResponse): Array<{ id: string; name?: string }> {
  return (api as any).services ?? api.amenities ?? [];
}

export function getRawTypes(api: SearchFiltersResponse): Array<{ id: string; name?: string }> {
  return api.accommodationTypes ?? [];
}

export function getRawMeals(api: SearchFiltersResponse): Array<{ id: string; name?: string }> {
  return api.meals ?? [];
}

export function getRawStars(api: SearchFiltersResponse): Array<number | { id: string }> {
  return (api.stars as any) ?? [];
}

export function shouldApplyRequestResult(cancelled: boolean, seq: number, currentSeq: number) {
  return !cancelled && seq === currentSeq;
}

export function clearPriceDebounce(timer: ReturnType<typeof setTimeout> | null) {
  if (timer) clearTimeout(timer);
}

export function getNights(checkIn: string, checkOut: string): number {
  const from = new Date(checkIn).getTime();
  const to = new Date(checkOut).getTime();
  if (isNaN(from) || isNaN(to) || to <= from) return 1;
  return Math.max(1, Math.round((to - from) / (24 * 60 * 60 * 1000)));
}

interface SearchScreenProps {
  params: SearchNavigationParams;
  _onBack: () => void;
}

export function SearchScreen({ params: initialParams, _onBack }: SearchScreenProps) {

  const [committedSearch, setCommittedSearch] = useState<SearchNavigationParams>(initialParams);
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const draftFiltersRef = useRef<FiltersState>(EMPTY_FILTERS);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isEditSearchOpen, setIsEditSearchOpen] = useState(false);

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [filtersApi, setFiltersApi] = useState<SearchFiltersResponse>(EMPTY_API_FILTERS);
  const [contentHeight, setContentHeight] = useState(0);

  const [debouncedPrice, setDebouncedPrice] = useState<PriceRange>({ min: '', max: '' });
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  const filterOptions = buildFilterOptions(filtersApi);
  const hasResults = accommodations.length > 0;
  const hasNoResults = !isLoading && accommodations.length === 0;
  const hasActiveFilters = hasActive(appliedFilters);
  const showFilterControls = hasResults || hasActiveFilters;
  const nights = getNights(committedSearch.checkIn, committedSearch.checkOut);

  useEffect(() => {
    let cancelled = false;
    async function loadFilters() {
      try {
        const res = await getSearchFilters({
          destination: committedSearch.destination,
          checkIn: committedSearch.checkIn,
          checkOut: committedSearch.checkOut,
        });
        if (!cancelled) setFiltersApi(res);
      } catch {
        if (!cancelled) setFiltersApi(EMPTY_API_FILTERS);
      }
    }
    void loadFilters();
    return () => { cancelled = true; };
  }, [committedSearch]);

  useEffect(() => {
    const { min, max } = appliedFilters.price;
    clearPriceDebounce(priceDebounceRef.current);
    if (min.trim() === '' && max.trim() === '') {
      setDebouncedPrice({ min: '', max: '' });
      return;
    }
    priceDebounceRef.current = setTimeout(() => {
      setDebouncedPrice({ min, max });
    }, PRICE_DEBOUNCE_MS);
    return () => {
      clearPriceDebounce(priceDebounceRef.current);
    };
  }, [appliedFilters.price]);

  useEffect(() => {
    const seq = ++seqRef.current;
    let cancelled = false;

    async function loadProperties() {
      setIsLoading(true);
      try {
        const res = await getSearchProperties({
          destination: committedSearch.destination,
          checkIn: committedSearch.checkIn,
          checkOut: committedSearch.checkOut,
          adults: committedSearch.adults,
          children: committedSearch.children,
          rooms: committedSearch.rooms,
          pets: committedSearch.pets,
          priceMin: debouncedPrice.min ? Number(debouncedPrice.min) : undefined,
          priceMax: debouncedPrice.max ? Number(debouncedPrice.max) : undefined,
          amenities: appliedFilters.services,
          accommodationType: appliedFilters.accommodationTypes,
          stars: appliedFilters.stars.map(Number),
          mealPlan: appliedFilters.meals[0],
          page: currentPage,
          pageSize: PAGE_SIZE,
        });
        if (shouldApplyRequestResult(cancelled, seq, seqRef.current)) {
          setAccommodations(res.results ?? []);
          setTotalPages(Math.max(res.totalPages ?? 1, 1));
        }
      } catch {
        if (shouldApplyRequestResult(cancelled, seq, seqRef.current)) {
          setAccommodations([]);
          setTotalPages(1);
        }
      } finally {
        if (shouldApplyRequestResult(cancelled, seq, seqRef.current)) {
          setIsLoading(false);
        }
      }
    }

    void loadProperties();
    return () => { cancelled = true; };
  }, [
    committedSearch,
    debouncedPrice.min,
    debouncedPrice.max,
    appliedFilters.services,
    appliedFilters.accommodationTypes,
    appliedFilters.stars,
    appliedFilters.meals,
    currentPage,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleUpdateSearch = useCallback((next: SearchNavigationParams) => {
    setCommittedSearch(next);
    setCurrentPage(1);
  }, []);

  const handleOpenFilters = useCallback(() => {
    const next = cloneFilters(appliedFilters);
    draftFiltersRef.current = next;
    setDraftFilters(next);
    setIsFiltersOpen(true);
  }, [appliedFilters]);

  const handleCancelFilters = useCallback(() => {
    const next = cloneFilters(appliedFilters);
    draftFiltersRef.current = next;
    setDraftFilters(next);
    setIsFiltersOpen(false);
  }, [appliedFilters]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(cloneFilters(draftFiltersRef.current));
    setCurrentPage(1);
    setIsFiltersOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setAppliedFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDraftFilterChange = useCallback((patch: Partial<FiltersState>) => {
    setDraftFilters((prev) => {
      const next = { ...prev, ...patch };
      draftFiltersRef.current = next;
      return next;
    });
  }, []);

  const renderHeader = () => (
    <View>
      <SearchSummaryBar
        params={committedSearch}
        onEditSearch={() => setIsEditSearchOpen(true)}
      />

      {showFilterControls && (
        <View style={styles.filterStack}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={handleOpenFilters}
            activeOpacity={0.7}
            testID="search-filter-btn"
            accessibilityRole="button"
            accessibilityLabel={t('search.filter')}
          >
            <Text style={styles.filterBtnText}>{t('search.filter')}</Text>
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={handleClearFilters}
              activeOpacity={0.7}
              testID="search-clear-filters-btn"
              accessibilityRole="button"
              accessibilityLabel={t('search.clearFilters')}
            >
              <Text style={styles.filterBtnText}>{t('search.clearFilters')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingBox} testID="search-loading-indicator">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {hasNoResults && (
        <Text style={styles.emptyMessage} testID="search-no-results">
          {t('search.noResults')}
        </Text>
      )}
    </View>
  );

  const renderFooter = () => (
    <>
      {hasResults && !isLoading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </>
  );

  return (
    <View style={styles.root}>
      <HomeBackground contentHeight={contentHeight} />

      <FlatList
        data={!isLoading ? accommodations : []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <AccommodationCard
              accommodation={item}
              nights={nights}
              adults={committedSearch.adults}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        onContentSizeChange={(_, h) => setContentHeight(h)}
      />

      <FilterPanel
        isOpen={isFiltersOpen}
        filters={draftFilters}
        options={filterOptions}
        onFiltersChange={handleDraftFilterChange}
        onCancel={handleCancelFilters}
        onApply={handleApplyFilters}
      />

      <SearchBottomSheet
        isOpen={isEditSearchOpen}
        onClose={() => setIsEditSearchOpen(false)}
        onSearch={handleUpdateSearch}
        initialDestination={committedSearch.destination}
        initialCheckIn={committedSearch.checkIn}
        initialCheckOut={committedSearch.checkOut}
        initialGuests={{
          adults: committedSearch.adults,
          children: committedSearch.children,
          rooms: committedSearch.rooms,
          pets: committedSearch.pets,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
  },
  filterStack: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  filterBtn: {
    width: '33%',
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 15,
    color: colors.primary,
    lineHeight: 18,
  },
  loadingBox: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    fontFamily: 'Quicksand_700Bold',
    marginVertical: 40,
    textAlign: 'center',
    color: colors.secondary,
    fontSize: 18,
  },
  cardWrapper: {
    flex: 1,
  },
  cardSeparator: {
    height: 16,
  },
});
