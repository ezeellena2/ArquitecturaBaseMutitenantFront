import type { FormCatalogItemRow, FormCatalogValueType } from "../api/types";
import { useCatalogData } from "./useCatalogData";
import { useCatalogDraft } from "./useCatalogDraft";
import { useCatalogSave } from "./useCatalogSave";

export type { CatalogRowView, ItemDraft, ItemField, RowError } from "../lib/catalogDraft";
export { rowHasErrors } from "../lib/catalogDraft";
export type { CatalogDraftSnapshot } from "./useCatalogDraft";
export type { CatalogConflict, CatalogSaveExtra } from "./useCatalogSave";

const noRows: readonly FormCatalogItemRow[] = [];

/**
 * El editor de un catálogo a mano (C3), armado con sus tres partes: lo que lee del servidor (`useCatalogData`), el borrador
 * con sus reglas (`useCatalogDraft`) y el guardado con su conflicto (`useCatalogSave`). Todo viaja junto en un `PUT`, con la
 * versión de la lectura, y solo lo que cambió. Guardar conserva la página, la búsqueda y las filas a la vista (F7 del
 * traspaso 15, 160). `extraRows`: las guardadas de otras páginas que toca una propuesta del asistente, leídas por su consulta.
 */
export function useCatalogEditor(id: string | undefined, { newValueType = "Text", extraRows = noRows }: {
  newValueType?: FormCatalogValueType;
  extraRows?: readonly FormCatalogItemRow[];
} = {}) {
  const data = useCatalogData(id);
  const valueType: FormCatalogValueType = data.saved?.valueType ?? newValueType;
  const draft = useCatalogDraft({ pageRows: data.pageRows, extraRows, saved: data.saved, valueType });
  const saving = useCatalogSave(id, data, draft);

  return {
    catalog: data.catalog,
    items: data.items,
    saved: data.saved,
    valueType,
    page: data.page, setPage: data.setPage, pageSize: data.pageSize, setPageSize: data.setPageSize,
    searchInput: data.searchInput, setSearchInput: data.setSearchInput, searching: data.searching,
    ...draft,
    ...saving,
  };
}

export type CatalogEditor = ReturnType<typeof useCatalogEditor>;
