import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { useTranslation } from "react-i18next";
import type { PagedResult } from "@/shared/api/pagedResult";
import { pageSizes } from "@/shared/api/pageSizes";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "./app/AppChrome";
import { Button } from "./button";
import { LoadMore } from "./LoadMore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type PaginationProps = Pick<
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
  const { phone } = useAppChrome();
  // Tablero M-Auditoria-Org (.ap-mas): en el teléfono no hay páginas; «Cargar más» pide la página más grande que
  // sigue. Pasado el tamaño mayor, avanza de página.
  if (phone) {
    const larger = pageSizes.find((size) => size > pageSize);
    return <LoadMore hasMore={hasNext} onLoadMore={() => (larger ? onPageSizeChange(larger) : onPageChange(page + 1))} />;
  }
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  // Tableros Empresas, Empresa y Usuarios: el pie en letra de 12; con una sola fila en la página, «1 de 1».
  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-t border-[var(--borde)] px-4 py-2 text-[12px] text-[var(--t2)]"
    >
      <p className="tabular-nums">
        {from === to
          ? t("pagination.single", { from: formatInteger(from), total: formatInteger(totalCount) })
          : t("pagination.range", { from: formatInteger(from), to: formatInteger(to), total: formatInteger(totalCount) })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger
            size="sm"
            aria-label={t("pagination.rowsPerPage")}
            className="h-7 rounded-full border-[var(--borde)] bg-[var(--lado-activo)] px-2.5 text-[12px] text-[var(--t2)] shadow-none"
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
          {/* Sin filas, «Página 1 de 1» y no «de 0» (tablero Roles, «Ningún rol coincide con los filtros»). */}
          {t("pagination.page", { page: formatInteger(page), totalPages: formatInteger(Math.max(totalPages, 1)) })}
        </span>
        <Button
          type="button"
          variant="icon"
          size="icon"
          aria-label={t("pagination.previous")}
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="text-[var(--t2)] hover:bg-[var(--marca-t)] hover:text-[var(--marca-tx)]"
        >
          <ChevronLeftIcon strokeWidth={2} className="size-4" />
        </Button>
        <Button
          type="button"
          variant="icon"
          size="icon"
          aria-label={t("pagination.next")}
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="text-[var(--t2)] hover:bg-[var(--marca-t)] hover:text-[var(--marca-tx)]"
        >
          <ChevronRightIcon strokeWidth={2} className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
