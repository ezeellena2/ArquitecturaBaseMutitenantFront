import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { useTranslation } from "react-i18next";
import type { PagedResultOfRoleResponse } from "@/shared/api/types";
import { pageSizes } from "@/shared/api/pageSizes";
import { cn } from "@/shared/lib/utils";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "./app/AppChrome";
import { Button } from "./button";
import { LoadMore } from "./LoadMore";
import { Picker } from "./Picker";

export type PaginationProps = Required<Pick<
  PagedResultOfRoleResponse,
  "page" | "pageSize" | "totalCount" | "totalPages" | "hasPrevious" | "hasNext"
>> & {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** El directorio público conserva rango, página y flechas; los listados privados usan la app. */
  variant?: "app" | "web";
  /** La pantalla web, fuera de PrivateLayoutFrame, declara si está en el teléfono. */
  mobile?: boolean;
  /** Apaga los controles mientras se carga otra página (por ejemplo, en la revisión de importar). */
  disabled?: boolean;
};

// El rango y la navegación quedan en la misma superficie que la tabla.
export function Pagination({
  page, pageSize, totalCount, totalPages, hasPrevious, hasNext, onPageChange, onPageSizeChange, variant = "app", mobile = false, disabled = false,
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
    return <LoadMore hasMore={hasNext} isLoading={disabled} onLoadMore={() => (larger ? onPageSizeChange(larger) : onPageChange(page + 1))} />;
  }
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  // Tableros Empresas, Empresa y Usuarios: el pie en letra de 12, con las cifras de su ancho de siempre (.pag); con una sola
  // fila en la página, «1 de 1».
  return (
    <nav
      aria-label={t("pagination.label")}
      className={cn("flex min-h-12 flex-wrap items-center justify-between gap-3 border-t border-[var(--borde)] px-4 py-2 text-[0.75rem] text-[var(--t2)]", web ? "border-0" : "", webPhone ? "min-h-0 px-0 py-1" : "")}
    >
      <p>
        {from === to
          ? t("pagination.single", { from: formatInteger(from), total: formatInteger(totalCount) })
          : t("pagination.range", { from: formatInteger(from), to: formatInteger(to), total: formatInteger(totalCount) })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {/* 262: las filas por página se eligen en la pieza, del tamaño de la barra de la página. */}
        {!webPhone ? <Picker label={t("pagination.rowsPerPage")} value={String(pageSize)} disabled={disabled}
          onChange={(value) => { if (Number(value) !== pageSize) onPageSizeChange(Number(value)); }}
          options={pageSizes.map((size) => ({ value: String(size), label: t("pagination.perPage", { size }) }))}
          className="h-7 w-auto rounded-[0.5rem] border-[var(--borde)] px-2.5 text-[0.75rem] text-[var(--t2)] max-md:h-7 max-md:rounded-[0.5rem] max-md:px-2.5 max-md:text-[0.75rem]" /> : null}
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
          disabled={disabled || !hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className={cn("text-[var(--t3)] hover:bg-[var(--marca-t)] hover:text-[var(--marca-tx)] disabled:opacity-40", web ? "size-7 rounded-[0.4375rem]" : "")}
        >
          <ChevronLeftIcon strokeWidth={2} className="size-4" />
        </Button>
        <Button
          type="button"
          variant="icon"
          size="icon"
          aria-label={t("pagination.next")}
          disabled={disabled || !hasNext}
          onClick={() => onPageChange(page + 1)}
          className={cn("text-[var(--t3)] hover:bg-[var(--marca-t)] hover:text-[var(--marca-tx)] disabled:opacity-40", web ? "size-7 rounded-[0.4375rem]" : "")}
        >
          <ChevronRightIcon strokeWidth={2} className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
