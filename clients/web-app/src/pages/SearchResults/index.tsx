import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Button from "@/components/Button";
import Container from "@/components/Container";
import FilterGroup from "@/components/FilterGroup";
import PriceFilter from "@/components/PriceFilter";
import SearchFilterPanel from "@/components/SearchFilterPanel";
import AccommodationCard from "@/components/AccommodationCard";
import Pagination from "@/components/Pagination";
import SearchResultsSearchSummary from "@/components/SearchResultsSearchSummary";
import LoadingSpinner from "@/components/LoadingSpinner";
import SubView from "@/components/SubView";
import { useSearchParams } from "react-router-dom";
import { useSearch } from "@/context/SearchContext";
import type { Accommodation } from "@/types/accommodation";
import type { FilterOption as UIFilterOption } from "@/components/FilterGroup";
import { getSearchFilters, getSearchProperties } from "@/services/searchService";
import type { SearchFiltersResponse } from "@/types/searchApi";
import { cn } from "@/lib/utils";
import type { CommittedSearchPayload } from "@/types/search";
import {
  addDaysLocal,
  committedSearchEqual,
  committedSearchFromUrlParams,
  committedSearchToUrlParams,
  defaultCommittedSearch,
  formatLocalYmd,
  normalizeCommittedSearch,
} from "@/utils/searchUrl";
import { FILTER_INPUT_DEBOUNCE_MS } from "@/constants/app";
import "./SearchResults.css";

const MOBILE_BREAKPOINT = 640;
const PAGE_SIZE_DESKTOP = 20;
const PAGE_SIZE_MOBILE = 10;

interface PriceRange {
  min: string;
  max: string;
}

interface SearchFiltersState {
  price: PriceRange;
  services: string[];
  accommodationTypes: string[];
  stars: string[];
  meals: string[];
}

const EMPTY_FILTERS: SearchFiltersState = {
  price: { min: "", max: "" },
  services: [],
  accommodationTypes: [],
  stars: [],
  meals: [],
};

const cloneFilters = (filters: SearchFiltersState): SearchFiltersState => ({
  price: { ...filters.price },
  services: [...filters.services],
  accommodationTypes: [...filters.accommodationTypes],
  stars: [...filters.stars],
  meals: [...filters.meals],
});

interface SearchResultsFiltersColumnProps {
  collapsible?: boolean;
  filters: SearchFiltersState;
  onFiltersChange: (patch: Partial<SearchFiltersState>) => void;
  options: {
    services: UIFilterOption[];
    accommodationTypes: UIFilterOption[];
    meals: UIFilterOption[];
    stars: UIFilterOption[];
  };
}

const SearchResultsFiltersColumn = ({
  collapsible = true,
  filters,
  onFiltersChange,
  options,
}: SearchResultsFiltersColumnProps) => {
  const { t } = useTranslation();

  return (
    <>
      <PriceFilter
        collapsible={collapsible}
        value={filters.price}
        onChange={(price) => onFiltersChange({ price })}
      />
      <FilterGroup
        title={t("searchResults.services")}
        options={options.services}
        withSearch
        collapsible={collapsible}
        selected={filters.services}
        onChange={(services) => onFiltersChange({ services })}
      />
      <FilterGroup
        title={t("searchResults.accommodationType")}
        options={options.accommodationTypes}
        withSearch
        collapsible={collapsible}
        selected={filters.accommodationTypes}
        onChange={(accommodationTypes) =>
          onFiltersChange({ accommodationTypes })
        }
      />
      <FilterGroup
        title={t("searchResults.meals")}
        options={options.meals}
        withSearch
        collapsible={collapsible}
        selected={filters.meals}
        onChange={(meals) => onFiltersChange({ meals })}
      />
      <FilterGroup
        title={t("searchResults.stars")}
        options={options.stars}
        withSearch
        className="filter-stars"
        collapsible={collapsible}
        selected={filters.stars}
        onChange={(stars) => onFiltersChange({ stars })}
      />
    </>
  );
};

const filterOptionsFromApi = (
  t: TFunction,
  filters: SearchFiltersResponse,
): SearchResultsFiltersColumnProps["options"] => ({
  services: filters.services.map(({ id }) => ({
    id,
    label: t(`searchResults.service.${id}`),
  })),
  accommodationTypes: filters.accommodationTypes.map(({ id }) => ({
    id,
    label: t(`searchResults.accommodation.${id}`),
  })),
  meals: filters.meals.map(({ id }) => ({
    id,
    label: t(`searchResults.meal.${id}`),
  })),
  stars: filters.stars.map(({ id }) => ({
    id,
    label: "★".repeat(Number(id)),
  })),
});

const SearchResults = () => {
  const { t } = useTranslation();
  const { setDestination, setDateRange, setGuests } = useSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [committedSearch, setCommittedSearch] =
    useState<CommittedSearchPayload | null>(null);
  const committedSearchRef = useRef<CommittedSearchPayload | null>(null);
  committedSearchRef.current = committedSearch;
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFiltersState>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<SearchFiltersState>(EMPTY_FILTERS);
  const draftFiltersRef = useRef<SearchFiltersState>(EMPTY_FILTERS);
  const [pageSize, setPageSize] = useState(() =>
    typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
      ? PAGE_SIZE_MOBILE
      : PAGE_SIZE_DESKTOP,
  );
  const [filtersApi, setFiltersApi] = useState<SearchFiltersResponse>({
    accommodationTypes: [],
    services: [],
    meals: [],
    stars: [],
  });
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedPrice, setDebouncedPrice] = useState<PriceRange>({
    min: "",
    max: "",
  });
  const hasResults = accommodations.length > 0;
  const hasNoResults = !isLoading && accommodations.length === 0;

  const handleCommitSearch = useCallback(
    (next: CommittedSearchPayload) => {
      const normalized = normalizeCommittedSearch(next);
      setDestination(normalized.destination);
      setDateRange(normalized.dateRange);
      setGuests({ ...normalized.guests });
      setCommittedSearch(normalized);
      setCurrentPage(1);
      setSearchParams(committedSearchToUrlParams(normalized), { replace: true });
    },
    [setDestination, setDateRange, setGuests, setSearchParams],
  );

  useEffect(() => {
    const parsed = committedSearchFromUrlParams(searchParams);

    if (parsed) {
      const normalized = normalizeCommittedSearch(parsed);
      if (
        committedSearchRef.current &&
        committedSearchEqual(committedSearchRef.current, normalized)
      ) {
        return;
      }
      setDestination(normalized.destination);
      setDateRange(normalized.dateRange);
      setGuests(normalized.guests);
      setCommittedSearch(normalized);
      return;
    }

    const qs = searchParams.toString();

    if (!qs && committedSearchRef.current) {
      setSearchParams(
        committedSearchToUrlParams(committedSearchRef.current),
        { replace: true },
      );
      return;
    }

    const fallback = defaultCommittedSearch();
    setDestination(fallback.destination);
    setDateRange(fallback.dateRange);
    setGuests(fallback.guests);
    setCommittedSearch(fallback);
    setSearchParams(committedSearchToUrlParams(fallback), { replace: true });
  }, [
    searchParams,
    setDestination,
    setDateRange,
    setGuests,
    setSearchParams,
  ]);

  const filterOptions = useMemo(
    () => filterOptionsFromApi(t, filtersApi),
    [t, filtersApi],
  );

  useEffect(() => {
    if (!committedSearch) return;
    const fromDate = committedSearch.dateRange?.from ?? new Date();
    const checkIn = formatLocalYmd(fromDate);
    const checkOut = committedSearch.dateRange?.to
      ? formatLocalYmd(committedSearch.dateRange.to)
      : formatLocalYmd(addDaysLocal(fromDate, 1));
    const loadFilters = async () => {
      try {
        const response = await getSearchFilters({
          destination: committedSearch.destination.trim(),
          checkIn,
          checkOut,
        });
        setFiltersApi(response);
      } catch {
        setFiltersApi({
          accommodationTypes: [],
          services: [],
          meals: [],
          stars: [],
        });
      }
    };
    void loadFilters();
  }, [committedSearch]);

  useEffect(() => {
    const handleResize = () => {
      const nextPageSize =
        window.innerWidth <= MOBILE_BREAKPOINT
          ? PAGE_SIZE_MOBILE
          : PAGE_SIZE_DESKTOP;
      setPageSize((prevPageSize) =>
        prevPageSize === nextPageSize ? prevPageSize : nextPageSize,
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const priceMin = appliedFilters.price.min;
    const priceMax = appliedFilters.price.max;
    if (priceMin.trim() === "" && priceMax.trim() === "") {
      setDebouncedPrice({ min: "", max: "" });
      return;
    }
    const id = window.setTimeout(() => {
      setDebouncedPrice({ min: priceMin, max: priceMax });
    }, FILTER_INPUT_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [appliedFilters.price.min, appliedFilters.price.max]);

  useEffect(() => {
    if (!committedSearch) return;

    const fromDate = committedSearch.dateRange?.from ?? new Date();
    const checkIn = formatLocalYmd(fromDate);
    const checkOut = committedSearch.dateRange?.to
      ? formatLocalYmd(committedSearch.dateRange.to)
      : formatLocalYmd(addDaysLocal(fromDate, 1));

    const loadProperties = async () => {
      setIsLoading(true);
      try {
        const response = await getSearchProperties({
          destination: committedSearch.destination.trim(),
          checkIn,
          checkOut,
          adults: committedSearch.guests.adults,
          children: committedSearch.guests.children,
          rooms: committedSearch.guests.rooms,
          pets: committedSearch.guests.pets,
          priceMin: debouncedPrice.min
            ? Number(debouncedPrice.min)
            : undefined,
          priceMax: debouncedPrice.max
            ? Number(debouncedPrice.max)
            : undefined,
          amenities: appliedFilters.services,
          accommodationType: appliedFilters.accommodationTypes,
          stars: appliedFilters.stars.map((star) => Number(star)),
          mealPlan: appliedFilters.meals[0],
          page: currentPage,
          pageSize,
        });
        setAccommodations(response.results);
        setTotalPages(Math.max(response.totalPages, 1));
      } catch {
        setAccommodations([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProperties();
  }, [
    committedSearch,
    debouncedPrice.min,
    debouncedPrice.max,
    appliedFilters.services,
    appliedFilters.accommodationTypes,
    appliedFilters.stars,
    appliedFilters.meals,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startFiltersLoading = () => {
    if (committedSearch) setIsLoading(true);
  };

  const handleAppliedFiltersPatch = (patch: Partial<SearchFiltersState>) => {
    startFiltersLoading();
    setAppliedFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleOpenFilters = () => {
    const nextDraft = cloneFilters(appliedFilters);
    draftFiltersRef.current = nextDraft;
    setDraftFilters(nextDraft);
    setIsFiltersSheetOpen(true);
  };

  const handleCancelFilters = () => {
    const nextDraft = cloneFilters(appliedFilters);
    draftFiltersRef.current = nextDraft;
    setDraftFilters(nextDraft);
    setIsFiltersSheetOpen(false);
  };

  const handleApplyFilters = () => {
    startFiltersLoading();
    setAppliedFilters(cloneFilters(draftFiltersRef.current));
    setIsFiltersSheetOpen(false);
  };

  const hasActiveFilters = useMemo(() => {
    const { price, services, accommodationTypes, stars, meals } =
      appliedFilters;
    return (
      price.min.trim() !== "" ||
      price.max.trim() !== "" ||
      services.length > 0 ||
      accommodationTypes.length > 0 ||
      stars.length > 0 ||
      meals.length > 0
    );
  }, [appliedFilters]);

  const showFilterControls = hasResults || hasActiveFilters;

  const handleClearFilters = () => {
    startFiltersLoading();
    setAppliedFilters(EMPTY_FILTERS);
  };

  return (
    <main className="search-results-page page-section">
      <Container>
        <SearchResultsSearchSummary onCommitSearch={handleCommitSearch} />
        {showFilterControls && (
          <div className="search-results-page__mobile-filter-stack">
            <button
              type="button"
              className="search-results-page__mobile-filter-btn"
              onClick={handleOpenFilters}
            >
              {t("searchResults.filter")}
            </button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "search-results-page__clear-filters-btn",
                  "search-results-page__clear-filters-btn--mobile",
                )}
                onClick={handleClearFilters}
              >
                {t("searchResults.clearFilters")}
              </Button>
            )}
          </div>
        )}
        <div className="search-results-page__grid">
          <aside className="search-results-page__filters">
            <SearchFilterPanel onCommitSearch={handleCommitSearch} />
            {showFilterControls && hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "search-results-page__clear-filters-btn",
                  "search-results-page__clear-filters-btn--desktop",
                )}
                onClick={handleClearFilters}
              >
                {t("searchResults.clearFilters")}
              </Button>
            )}
            {showFilterControls && (
              <SearchResultsFiltersColumn
                filters={appliedFilters}
                onFiltersChange={handleAppliedFiltersPatch}
                options={filterOptions}
              />
            )}
          </aside>
          <section className="search-results-page__content">
            <div className="search-results-page__cards">
              {isLoading && (
                <LoadingSpinner className="search-results-page__loading" />
              )}
              {hasNoResults && (
                <p className="search-results-page__empty-message">
                  {t("searchResults.noResults")}
                </p>
              )}
              {!isLoading &&
                accommodations.map((accommodation) => (
                  <AccommodationCard
                    key={accommodation.id}
                    accommodation={accommodation}
                  />
                ))}
            </div>
            {hasResults && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </section>
        </div>
      </Container>

      {showFilterControls && (
        <SubView
          isOpen={isFiltersSheetOpen}
          title={t("searchResults.filter")}
          onCancel={handleCancelFilters}
          onApply={handleApplyFilters}
        >
          <div className="search-results-page__filters-subview-content">
            <SearchResultsFiltersColumn
              collapsible={false}
              filters={draftFilters}
              onFiltersChange={(patch) =>
                setDraftFilters((prev) => {
                  const next = { ...prev, ...patch };
                  draftFiltersRef.current = next;
                  return next;
                })
              }
              options={filterOptions}
            />
          </div>
        </SubView>
      )}
    </main>
  );
};

export default SearchResults;
