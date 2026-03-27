import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import Input from "@/components/Input";
import "./FilterGroup.css";

const PAGE_SIZE = 6;

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
}

const FilterGroup = ({
  title,
  options,
  selected,
  onChange,
  withSearch = false,
  searchPlaceholder,
  defaultOpen = true,
  pageSize = PAGE_SIZE,
}: FilterGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const checked = selected ?? internalSelected;
  const setChecked = onChange ?? setInternalSelected;

  const visibleOptions = options.slice(0, visibleCount);
  const hasMore = visibleCount < options.length;
  const hasLess = visibleCount > pageSize;

  const toggle = (id: string) => {
    const next = checked.includes(id)
      ? checked.filter((s) => s !== id)
      : [...checked, id];
    setChecked(next);
  };

  return (
    <div className="filter-card">
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

      <div
        className={cn("filter-card__body", isOpen && "filter-card__body--open")}
      >
        <div className="filter-card__overflow">
          <div className="filter-group__content">
            {withSearch && (
              <div className="input-box">
                <Input
                  placeholder={
                    searchPlaceholder ?? `Busca por ${title.toLowerCase()}`
                  }
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
                  setVisibleCount((v) => Math.min(v + pageSize, options.length))
                }
              >
                Ver más <ChevronDown size={14} />
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
                Ver menos <ChevronUp size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterGroup;
