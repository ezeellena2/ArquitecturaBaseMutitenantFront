import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PagedResult } from "@/shared/api/pagedResult";
import { pageSizes } from "@/shared/api/pageSizes";
import { useFormat } from "@/shared/format/useFormat";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type PaginationProps = Pick<
  PagedResult<unknown>,
  "page" | "pageSize" | "totalCount" | "totalPages" | "hasPrevious" | "hasNext"
> & {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

// El rango y la navegación quedan en la misma superficie que la tabla.
export function Pagination({
  page, pageSize, totalCount, totalPages, hasPrevious, hasNext, onPageChange, onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation();
  const { formatInteger } = useFormat();
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-t border-[var(--borde)] px-4 py-2 text-[13px] text-[var(--t2)]"
    >
      <p className="tabular-nums">
        {t("pagination.range", {
          from: formatInteger(from), to: formatInteger(to), total: formatInteger(totalCount),
        })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger
            size="sm"
            aria-label={t("pagination.rowsPerPage")}
            className="min-h-11 rounded-full border-[var(--borde)] bg-[var(--lado-activo)] px-3 text-[13px] text-[var(--t2)] shadow-none md:min-h-8"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end" className="border-[var(--borde)] bg-[var(--lado-activo)] text-[var(--t1)]">
            {pageSizes.map((size) => (
              <SelectItem key={size} value={String(size)}>{t("pagination.perPage", { size })}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="tabular-nums">
          {t("pagination.page", { page: formatInteger(page), totalPages: formatInteger(totalPages) })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("pagination.previous")}
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="min-h-11 min-w-11 text-[var(--t2)] hover:bg-[var(--marca-t)] hover:text-[var(--marca-tx)] md:min-h-8 md:min-w-8"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("pagination.next")}
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="min-h-11 min-w-11 text-[var(--t2)] hover:bg-[var(--marca-t)] hover:text-[var(--marca-tx)] md:min-h-8 md:min-w-8"
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
