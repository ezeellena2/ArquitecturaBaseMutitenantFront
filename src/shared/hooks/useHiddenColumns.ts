import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useQueryUpdate } from "./useQueryUpdate";

/// Las columnas que «Columnas» (`ColumnsMenu`) ocultó, en la URL, como la página y los filtros de un listado: el enlace que
/// se comparte y el botón atrás las conservan. Se guardan las ocultas y no las que se ven, así una columna nueva aparece
/// sin tocar el enlace; sin ninguna oculta, el parámetro no va.
export function useHiddenColumns(param = "hiddenColumns") {
  const [params] = useSearchParams();
  const update = useQueryUpdate();
  const raw = params.get(param) ?? "";
  const hidden = useMemo(() => raw.split(",").filter(Boolean), [raw]);
  const setHidden = useCallback((next: readonly string[]) => update({ [param]: next.join(",") }), [update, param]);
  return { hidden, setHidden } as const;
}
