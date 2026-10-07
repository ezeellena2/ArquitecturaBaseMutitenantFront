import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { useTranslation } from "react-i18next";
import type { PagedResult } from "@/shared/api/pagedResult";
import { pageSizes } from "@/shared/api/pageSizes";
import { cn } from "@/shared/lib/utils";
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
  /** El directorio público conserva rango, página y flechas; los listados privados usan la app. */
  variant?: "app" | "web";
  /** La pantalla web, fuera de PrivateLayoutFrame, declara si está en el teléfono. */
  mobile?: boolean;
};

// El rango y la navegación quedan en la misma superficie que la tabla.
export function Pagination({
  page, pageSize, totalCount, totalPages, hasPrevious, hasNext, onPageChange, onPageSizeChange, variant = "app", mobile = false,
}: PaginationProps) {
  const { t } = useTranslation();
  const { formatInteger } = useFormat();
  const { phone } = useAppChrome();
  const web = variant === "web";
  const webPhone = web && mobile;
  // Tablero M-Auditoria-Org (.ap-mas): en el teléfono no hay páginas; «Cargar más» pide la página más grande que
  // sigue. Pasado el tamaño mayor, avanza de página.
  if (phone && !web) {
    const larger = pageSizes.find((size) => size > pageSize);
    return <LoadMore hasMore={hasNext} onLoadMore={() => (larger ? onPageSizeChange(larger) : onPageChange(page + 1))} />;
  }
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  // Tableros Empresas, Empresa y Usuarios: el pie en letra de 12, con las cifras de su ancho de siempre (.pag); con una sola
  // fila en la página, «1 de 1».
  return (
    <nav
      aria-label={t("pagination.label")}
      className={cn("flex min-h-12 flex-wrap items-center justify-between gap-3 border-t border-[var(--borde)] px-4 py-2 text-[12px] text-[var(--t2)]", web ? "border-0" : "", webPhone ? "min-h-0 px-0 py-1" : "")}
    >
      <p>
        {from === to
          ? t("pagination.single", { from: formatInteger(from), total: formatInteger(totalCount) })
          : t("pagination.range", { from: formatInteger(from), to: formatInteger(to), total: formatInteger(totalCount) })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {!webPhone ? <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
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
        </Select> : null}
        <span>
          {/* Sin filas, «Página 1 de 1» y no «de 0» (tablero Roles, «Ningún rol coincide con los filtros»). */}
          {t("pagination.page", { page: formatInteger(page), totalPages: formatInteger(Math.max(totalPages, 1)) })}
        </span>
        {/* .pag .ico-btn: las flechas en el gris de los íconos (--t3) y, sin otra página, al 40 %. */}
        <Button
          type="button"
          variant="icon"
          size="icon"
          aria-label={t("pagination.previous")}
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className={cn("text-[var(--t3)] hover:bg-[var(--marca-t)] hover:text-[var(--marca-tx)] disabled:opacity-40", web ? "size-7 rounded-[7px]" : "")}
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
          className={cn("text-[var(--t3)] hover:bg-[var(--marca-t)] hover:text-[var(--marca-tx)] disabled:opacity-40", web ? "size-7 rounded-[7px]" : "")}
        >
          <ChevronRightIcon strokeWidth={2} className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
