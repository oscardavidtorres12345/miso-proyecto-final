import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  FILTER_GROUP_SEARCH_MIN_OPTIONS,
  FILTER_GROUP_VISIBLE_OPTIONS_STEP,
  FILTER_INPUT_DEBOUNCE_MS,
} from "@/constants/app";
import "./FilterGroup.css";

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterGroupProps {
  title: string;
  options: FilterOption[];
  selected?: string[];
  onChange?: (selected: string[]) => void;
  withSearch?: boolean;
  searchPlaceholder?: string;
  defaultOpen?: boolean;
  pageSize?: number;
  className?: string;
  collapsible?: boolean;
}

const FilterGroup = ({
  title,
  options,
  selected,
  onChange,
  withSearch = false,
  searchPlaceholder,
  defaultOpen = true,
  pageSize = FILTER_GROUP_VISIBLE_OPTIONS_STEP,
  className,
  collapsible = true,
}: FilterGroupProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const checked = selected ?? internalSelected;
  const setChecked = onChange ?? setInternalSelected;

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, FILTER_INPUT_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [debouncedSearchQuery, pageSize]);

  const filteredOptions = debouncedSearchQuery.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
      )
    : options;
  const shouldShowSearch =
    withSearch && options.length > FILTER_GROUP_SEARCH_MIN_OPTIONS;

  const visibleOptions = filteredOptions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredOptions.length;
  const hasLess = visibleCount > pageSize;

  const toggle = (id: string) => {
    const next = checked.includes(id)
      ? checked.filter((s) => s !== id)
      : [...checked, id];
    setChecked(next);
  };

  return (
    <div className={cn("filter-card", className)}>
      {collapsible ? (
        <button
          className="filter-card__header"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
        >
          <span className="filter-card__title">{title}</span>
          <ChevronDown
            className={cn(
              "filter-card__chevron",
              isOpen && "filter-card__chevron--open",
            )}
          />
        </button>
      ) : (
        <div className="filter-card__header">
          <span className="filter-card__title">{title}</span>
        </div>
      )}

      <div
        className={cn("filter-card__body", (isOpen || !collapsible) && "filter-card__body--open")}
      >
        <div className="filter-card__overflow">
          <div className="filter-group__content">
            {shouldShowSearch && (
              <div className="input-box">
                <Input
                  placeholder={
                    searchPlaceholder ??
                    t("searchResults.searchInFilter", { title: title.toLowerCase() })
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  rightIcon={<Search size={16} />}
                />
              </div>
            )}

            <div className="filter-group__options">
              {visibleOptions.map((option) => (
                <label key={option.id} className="filter-group__option">
                  <input
                    type="checkbox"
                    className="filter-group__checkbox"
                    checked={checked.includes(option.id)}
                    onChange={() => toggle(option.id)}
                  />
                  <span className="filter-group__option-label">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {hasMore && (
              <Button
                variant="outline"
                className="filter-group__more-btn"
                onClick={() =>
                  setVisibleCount((v) => Math.min(v + pageSize, filteredOptions.length))
                }
              >
                {t("searchResults.showMore")} <ChevronDown size={14} />
              </Button>
            )}

            {hasLess && (
              <Button
                variant="outline"
                className="filter-group__more-btn"
                onClick={() =>
                  setVisibleCount((v) => Math.max(v - pageSize, pageSize))
                }
              >
                {t("searchResults.showLess")} <ChevronUp size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterGroup;
