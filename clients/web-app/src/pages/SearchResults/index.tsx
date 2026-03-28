import { useEffect, useMemo, useState } from "react";
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
import SubView from "@/components/SubView";
import { MOCK_ACCOMMODATIONS } from "@/mocks/accommodations";
import {
  MOCK_SERVICES,
  MOCK_ACCOMMODATION_TYPES,
  MOCK_MEALS,
  MOCK_STARS,
} from "@/mocks/filters";
import type { FilterOption } from "@/components/FilterGroup";
import { cn } from "@/lib/utils";
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

interface SearchResultsFiltersColumnProps {
  collapsible?: boolean;
  filters: SearchFiltersState;
  onFiltersChange: (patch: Partial<SearchFiltersState>) => void;
  options: {
    services: FilterOption[];
    accommodationTypes: FilterOption[];
    meals: FilterOption[];
    stars: FilterOption[];
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
        collapsible={collapsible}
        selected={filters.accommodationTypes}
        onChange={(accommodationTypes) =>
          onFiltersChange({ accommodationTypes })
        }
      />
      <FilterGroup
        title={t("searchResults.meals")}
        options={options.meals}
        collapsible={collapsible}
        selected={filters.meals}
        onChange={(meals) => onFiltersChange({ meals })}
      />
      <FilterGroup
        title={t("searchResults.stars")}
        options={options.stars}
        className="filter-stars"
        collapsible={collapsible}
        selected={filters.stars}
        onChange={(stars) => onFiltersChange({ stars })}
      />
    </>
  );
};

const filterOptionsFromMocks = (
  t: TFunction,
): SearchResultsFiltersColumnProps["options"] => ({
  services: MOCK_SERVICES.map(({ id }) => ({
    id,
    label: t(`searchResults.service.${id}`),
  })),
  accommodationTypes: MOCK_ACCOMMODATION_TYPES.map(({ id }) => ({
    id,
    label: t(`searchResults.accommodation.${id}`),
  })),
  meals: MOCK_MEALS.map(({ id }) => ({
    id,
    label: t(`searchResults.meal.${id}`),
  })),
  stars: MOCK_STARS.map(({ id }) => ({
    id,
    label: "★".repeat(Number(id)),
  })),
});

const SearchResults = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<SearchFiltersState>(
    EMPTY_FILTERS,
  );
  const [draftFilters, setDraftFilters] =
    useState<SearchFiltersState>(EMPTY_FILTERS);
  const [pageSize, setPageSize] = useState(() =>
    typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
      ? PAGE_SIZE_MOBILE
      : PAGE_SIZE_DESKTOP,
  );

  const filterOptions = useMemo(() => filterOptionsFromMocks(t), [t]);

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

  const totalPages = Math.ceil(MOCK_ACCOMMODATIONS.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleAccommodations = MOCK_ACCOMMODATIONS.slice(
    startIndex,
    startIndex + pageSize,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenFilters = () => {
    setDraftFilters(appliedFilters);
    setIsFiltersSheetOpen(true);
  };

  const handleCancelFilters = () => {
    setDraftFilters(appliedFilters);
    setIsFiltersSheetOpen(false);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
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

  const handleClearFilters = () => {
    setAppliedFilters(EMPTY_FILTERS);
  };

  return (
    <main className="search-results-page page-section">
      <Container>
        <SearchResultsSearchSummary />
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
        <div className="search-results-page__grid">
          <aside className="search-results-page__filters">
            <SearchFilterPanel />
            {hasActiveFilters && (
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
            <SearchResultsFiltersColumn
              filters={appliedFilters}
              onFiltersChange={(patch) =>
                setAppliedFilters((prev) => ({ ...prev, ...patch }))
              }
              options={filterOptions}
            />
          </aside>
          <section className="search-results-page__content">
            <div className="search-results-page__cards">
              {visibleAccommodations.map((accommodation) => (
                <AccommodationCard
                  key={accommodation.id}
                  accommodation={accommodation}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </section>
        </div>
      </Container>

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
              setDraftFilters((prev) => ({ ...prev, ...patch }))
            }
            options={filterOptions}
          />
        </div>
      </SubView>
    </main>
  );
};

export default SearchResults;
