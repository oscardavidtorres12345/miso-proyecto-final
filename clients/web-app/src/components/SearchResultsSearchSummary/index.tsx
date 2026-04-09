import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearch } from "@/context/SearchContext";
import { useI18n } from "@/context/I18nContext";
import SearchBottomSheet from "@/components/SearchBottomSheet";
import { formatDateRange } from "@/utils/searchFormat";
import type { CommittedSearchPayload } from "@/types/search";
import "./SearchResultsSearchSummary.css";

type SearchResultsSearchSummaryProps = {
  onCommitSearch?: (payload: CommittedSearchPayload) => void;
};

const SearchResultsSearchSummary = ({
  onCommitSearch,
}: SearchResultsSearchSummaryProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { t } = useTranslation();
  const { language } = useI18n();
  const searchState = useSearch();

  const dateText = formatDateRange(searchState.dateRange, language);
  const guestsText = useMemo(() => {
    const total = searchState.guests.adults + searchState.guests.children;
    return t("guests.guest", { count: total });
  }, [searchState.guests.adults, searchState.guests.children, t]);

  return (
    <>
      <button
        type="button"
        className="search-results-summary"
        onClick={() => setIsSheetOpen(true)}
        aria-label={t("searchResults.editSearch")}
      >
        <Search className="search-results-summary__icon" />
        <div className="search-results-summary__copy">
          <span className="search-results-summary__destination">
            {searchState.destination}
          </span>
          <span className="search-results-summary__meta">
            {dateText} - {guestsText}
          </span>
        </div>
      </button>

      <SearchBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        variant={onCommitSearch ? "draft" : "live"}
        onDraftCommit={
          onCommitSearch
            ? (payload) => {
                onCommitSearch(payload);
              }
            : undefined
        }
        destination={searchState.destination}
        setDestination={searchState.setDestination}
        dateRange={searchState.dateRange}
        setDateRange={searchState.setDateRange}
        guests={searchState.guests}
        setGuests={searchState.setGuests}
      />
    </>
  );
};

export default SearchResultsSearchSummary;
