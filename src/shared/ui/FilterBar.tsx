import type { ReactNode } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Surface } from "@/shared/ui/Surface";

export interface FilterOption {
  value: string;
  label: string;
  count?: ReactNode;
}

export interface FilterBarFilter {
  key: string;
  label: string;
  menuLabel: string;
  count?: ReactNode;
  value: string;
  active: boolean;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  label: string;
  searchLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: readonly FilterBarFilter[];
  clearLabel: string;
  onClear: () => void;
  className?: string;
}

export function FilterBar({
  label,
  searchLabel,
  searchValue,
  onSearchChange,
  filters,
  clearLabel,
  onClear,
  className,
}: FilterBarProps) {
  const hasFilters = searchValue.trim().length > 0 || filters.some((filter) => filter.active);

  return (
    <Surface
      role="search"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-2 p-2.5 sm:p-3", className)}
    >
      <div className="relative w-full sm:w-[300px]">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-2 left-2.5 size-4 text-[var(--t3)]"
        />
        <Input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label={searchLabel}
          placeholder={searchLabel}
          className="h-8 bg-[var(--s2)] pl-8 text-[13px]"
        />
      </div>
      {filters.map((filter) => {
        const selected = filter.options.find((option) => option.value === filter.value);

        return (
          <DropdownMenu key={filter.key}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 rounded-full px-3 text-[13px] shadow-none",
                  filter.active
                    ? "border-[var(--marca)] bg-[var(--marca-t)] text-[var(--marca-tx)]"
                    : "border-[var(--borde)] bg-[var(--lado-activo)] text-[var(--t2)]",
                )}
              >
                {selected?.label ?? filter.label}
                {filter.count === undefined ? null : (
                  <span className="text-xs text-[var(--t2)]">{filter.count}</span>
                )}
                <ChevronDownIcon aria-hidden="true" className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" aria-label={filter.menuLabel}>
              <DropdownMenuRadioGroup value={filter.value} onValueChange={filter.onChange}>
                {filter.options.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                    {option.count === undefined ? null : (
                      <span className="ml-auto text-xs text-[var(--t2)]">
                        {option.count}
                      </span>
                    )}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-[8px] px-2 py-1.5 text-[13px] text-[var(--marca-tx)] hover:bg-[var(--marca-t)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]"
        >
          {clearLabel}
        </button>
      ) : null}
    </Surface>
  );
}
