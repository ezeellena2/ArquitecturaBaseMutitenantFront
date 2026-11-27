import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { NumberAmbiguousError } from "@/shared/format/parsers";
import { useFormat, type FormatState } from "@/shared/format/useFormat";
import {
  catalogItemsQueryKey,
  catalogQueryKey,
  catalogsQueryRoot,
  fetchCatalog,
  fetchCatalogItems,
  updateCatalog,
  type CatalogItemsQuery,
} from "../api/catalogs";
import type {
  FormCatalogItemInput,
  FormCatalogItemRow,
  FormCatalogItemSortInput,
  FormCatalogMoveDirection,
  FormCatalogResponse,
  FormCatalogValueType,
  PagedResultOfFormCatalogItemRow,
  UpdateFormCatalogRequest,
} from "../api/types";
import { catalogFieldErrors, isCatalogConflict } from "../errors";

/** El tope del texto y del detalle de una opción, el mismo que valida el servidor (269). */
export const itemTextMax = 30;
export const itemDetailMax = 300;
/** Hasta 10.000 opciones por catálogo, contando las dadas de baja (42). */
export const catalogItemsMax = 10_000;

export type ItemField = "code" | "text" | "detail" | "value";
export interface ItemDraft {
  readonly code: string;
  readonly text: string;
  readonly detail: string;
  /** Lo que se ve y se escribe: en un catálogo tipado, con la región del idioma (207); se manda canónico. */
  readonly value: string;
  readonly isActive: boolean;
}
interface NewItem extends ItemDraft { readonly localId: string }
type ItemEdits = Partial<ItemDraft>;

export type RowError = Partial<Record<ItemField | "row", string>>;

/** Una fila de la tabla de opciones: guardada (con lo que se cambió encima) o nueva. */
export interface CatalogRowView {
  readonly key: string;
  readonly itemId?: string;
  readonly localId?: string;
  /** La posición, con los movimientos pendientes; «—» en una nueva. */
  readonly number: number | null;
  readonly draft: ItemDraft;
  readonly isNew: boolean;
  readonly pendingDelete: boolean;
  readonly textRepeated: boolean;
  readonly errors: RowError;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
}

export interface CatalogConflict {
  readonly fresh: FormCatalogResponse;
  readonly freshItems: readonly FormCatalogItemRow[];
}

/** Las opciones del borrador como estaban al abrir el modal de opciones: «Cancelar» o Esc las devuelven así (117). */
export interface CatalogDraftSnapshot {
  readonly edits: Readonly<Record<string, ItemEdits>>;
  readonly added: readonly NewItem[];
  readonly deletes: ReadonlySet<string>;
  readonly selected: ReadonlySet<string>;
  readonly serverErrors: Readonly<Record<string, RowError>>;
}

/** Una opción con algún error (no el aviso de texto repetido, que no frena): la lista del modal la marca con un triángulo. */
export const rowHasErrors = (row: CatalogRowView) => Object.values(row.errors).some(Boolean);

const emptyEdits: Readonly<Record<string, ItemEdits>> = {};

/** El canónico «2500.5» como se ve en la región del idioma («2.500,5»), sin pasar por `Number`, que perdería dígitos (C6). */
export function displayValue(value: string | null | undefined, valueType: FormCatalogValueType, format: FormatState): string {
  if (value == null || value === "") return "";
  if (valueType === "Date") return format.formatDate(value) || value;
  if (valueType === "Text") return value;
  const culture = format.referenceData?.cultures.find((item) => item.code === format.culture);
  if (!culture) return value;
  const negative = value.startsWith("-");
  const [integer, fraction] = value.replace(/^[+-]/, "").split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, culture.groupSeparator);
  return `${negative ? "-" : ""}${grouped}${fraction === undefined ? "" : `${culture.decimalSeparator}${fraction}`}`;
}

type ValueRead = { canonical: string | null; error?: string };

/** Lee el valor escrito con la región del idioma y da el canónico, o el error de su campo (207 y C6). */
export function readValue(input: string, valueType: FormCatalogValueType, format: FormatState, t: (key: string) => string): ValueRead {
  if (valueType === "Text") return { canonical: input.trim() === "" ? null : input };
  if (input.trim() === "") return { canonical: null, error: t("forms:catalog.errors.valueRequired") };
  try {
    if (valueType === "Date") {
      const date = format.parseDate(input);
      return date ? { canonical: date } : { canonical: null, error: t("forms:catalog.errors.valueInvalid.Date") };
    }
    const canonical = format.parseDecimalText(input);
    if (canonical == null) return { canonical: null, error: t("forms:catalog.errors.valueRequired") };
    if (valueType === "WholeNumber" && canonical.includes(".")) return { canonical: null, error: t("forms:catalog.errors.valueInvalid.WholeNumber") };
    return { canonical };
  } catch (error) {
    if (error instanceof NumberAmbiguousError) return { canonical: null, error: t("common:fields.numberAmbiguous") };
    return { canonical: null, error: t(`forms:catalog.errors.valueInvalid.${valueType}`) };
  }
}

const sameText = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

let localSequence = 0;
const nextLocalId = () => `local-${Date.now().toString(36)}-${(localSequence += 1).toString(36)}`;

/**
 * El borrador del editor de un catálogo a mano (C3): las opciones cambiadas, las nuevas, las que se borran al guardar, los
 * movimientos y el orden pendientes, sobre la página que se ve. Todo viaja junto en un `PUT`, con la versión de la lectura,
 * y solo lo que cambió. Guardar conserva la página, la búsqueda y las filas a la vista (F7 del traspaso 15, 160).
 */
export function useCatalogEditor(id: string | undefined, newValueType: FormCatalogValueType = "Text") {
  const { t, i18n } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const queryClient = useQueryClient();

  const catalog = useQuery({ queryKey: catalogQueryKey(id ?? ""), queryFn: ({ signal }) => fetchCatalog(id!, signal), enabled: Boolean(id) });
  const saved = catalog.data;
  const valueType: FormCatalogValueType = saved?.valueType ?? newValueType;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<NonNullable<CatalogItemsQuery["pageSize"]>>(10);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim());
  const itemsQuery: CatalogItemsQuery = { page, pageSize, search: search || undefined, status: "All" };
  const items = useQuery({
    queryKey: catalogItemsQueryKey(id ?? "", itemsQuery),
    queryFn: ({ signal }) => fetchCatalogItems(id!, itemsQuery, signal),
    enabled: Boolean(id) && saved?.source === "Manual",
    // Una página tardía de otro catálogo se descarta: la clave lleva el id. Mientras llega la siguiente, la que se ve queda.
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[3] === id ? keepPreviousData(previous) : undefined,
  });

  const [version, setVersion] = useState<number | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [edits, setEdits] = useState<Readonly<Record<string, ItemEdits>>>(emptyEdits);
  const [added, setAdded] = useState<readonly NewItem[]>([]);
  const [deletes, setDeletes] = useState<ReadonlySet<string>>(new Set());
  const [moves, setMoves] = useState<readonly { itemId: string; direction: FormCatalogMoveDirection }[]>([]);
  const [positions, setPositions] = useState<Readonly<Record<string, number>>>({});
  const [sort, setSort] = useState<FormCatalogItemSortInput | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [serverErrors, setServerErrors] = useState<Readonly<Record<string, RowError>>>({});
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState<unknown>(undefined);
  const [conflict, setConflict] = useState<CatalogConflict | null>(null);
  // Sube cada vez que guardar encuentra un error en las opciones: el modal se abre en la primera con problemas (117).
  const [errorRound, setErrorRound] = useState(0);
  // Lo que se mandó: el índice de un error de `items[i]` o `deleteItems[i]` es el del pedido, no el de la tabla.
  const sent = useRef<{ items: string[]; deleteItems: string[] }>({ items: [], deleteItems: [] });

  // La versión con la que se guarda es la de la lectura con la que arrancó el editor; una relectura no la cambia (concurrencia).
  if (saved && version === undefined) setVersion(saved.version);

  const pageRows = useMemo(() => items.data?.items ?? [], [items.data]);
  const effective = (row: FormCatalogItemRow) => positions[row.id] ?? row.position;
  const ordered = [...pageRows].sort((a, b) => effective(a) - effective(b));
  const byPosition = new Map(ordered.map((row) => [effective(row), row]));

  const draftOf = (row: FormCatalogItemRow): ItemDraft => {
    const edit = edits[row.id] ?? {};
    return {
      code: edit.code ?? row.code,
      text: edit.text ?? row.text,
      detail: edit.detail ?? row.detail ?? "",
      value: edit.value ?? displayValue(row.value, valueType, format),
      isActive: edit.isActive ?? row.isActive,
    };
  };

  const visible = [
    ...ordered.map((row) => ({ key: row.id, row, draft: draftOf(row) })),
    ...added.map((item) => ({ key: item.localId, row: undefined, draft: item as ItemDraft })),
  ];

  function rowErrors(key: string, row: FormCatalogItemRow | undefined, draft: ItemDraft): RowError {
    const errors: RowError = { ...serverErrors[key] };
    if (draft.text.length > itemTextMax) errors.text ??= t("forms:catalog.errors.textTooLong", { n: itemTextMax });
    if (draft.detail.length > itemDetailMax) errors.detail ??= t("forms:catalog.errors.detailTooLong", { n: itemDetailMax });
    if (draft.code.trim()) {
      const other = visible.find((item) => item.key !== key && !deletes.has(item.key) && sameText(item.draft.code, draft.code));
      if (other?.row) errors.code ??= t("forms:catalog.errors.duplicateCode", { n: effective(other.row) });
    }
    // En un catálogo tipado, toda opción lleva su valor; uno guardado que no se tocó ya es canónico.
    if (valueType !== "Text" && (!row || edits[key]?.value !== undefined)) {
      const read = readValue(draft.value, valueType, format, t);
      if (read.error) errors.value ??= read.error;
    }
    return errors;
  }

  const rows: CatalogRowView[] = visible.map(({ key, row, draft }) => {
    const pendingDelete = deletes.has(key);
    const touched = !row || edits[key]?.text !== undefined;
    const textRepeated = touched
      ? draft.text.trim() !== "" && visible.some((item) => item.key !== key && !deletes.has(item.key) && sameText(item.draft.text, draft.text))
      : row.textRepeated;
    const neighbor = (offset: number) => row ? byPosition.get(effective(row) + offset) : undefined;
    const movable = Boolean(row) && !pendingDelete && deletes.size === 0;
    return {
      key,
      itemId: row?.id,
      localId: row ? undefined : key,
      number: row ? effective(row) : null,
      draft,
      isNew: !row,
      pendingDelete,
      textRepeated,
      errors: rowErrors(key, row, draft),
      canMoveUp: movable && Boolean(neighbor(-1)),
      canMoveDown: movable && Boolean(neighbor(1)),
    };
  });

  const currentName = name ?? saved?.name ?? "";
  const currentDescription = description ?? saved?.description ?? "";
  const itemsDirty = Object.keys(edits).length > 0 || added.length > 0 || deletes.size > 0 || moves.length > 0 || sort !== null;
  const isDirty = itemsDirty || (saved ? currentName !== saved.name || currentDescription !== (saved.description ?? "") : false);
  const total = (saved?.itemCounts.total ?? 0) + added.length - deletes.size;

  function edit(key: string, patch: ItemEdits) {
    setServerErrors((current) => {
      if (!current[key]) return current;
      const fields = Object.keys(patch) as (keyof RowError)[];
      return { ...current, [key]: Object.fromEntries(Object.entries(current[key]).filter(([field]) => !fields.includes(field as keyof RowError))) };
    });
    if (added.some((item) => item.localId === key)) {
      setAdded((current) => current.map((item) => item.localId === key ? { ...item, ...patch } : item));
      return;
    }
    const row = pageRows.find((item) => item.id === key);
    if (!row) return;
    setEdits((current) => {
      const next = { ...current[key], ...patch };
      // Volver a lo guardado deja la opción sin cambios: no viaja (C3).
      const base = { code: row.code, text: row.text, detail: row.detail ?? "", value: displayValue(row.value, valueType, format), isActive: row.isActive };
      const clean = Object.fromEntries(Object.entries(next).filter(([field, value]) => base[field as keyof ItemDraft] !== value));
      const rest = { ...current };
      delete rest[key];
      return Object.keys(clean).length ? { ...rest, [key]: clean } : rest;
    });
  }

  function add(): string {
    const localId = nextLocalId();
    setAdded((current) => [...current, { localId, code: "", text: "", detail: "", value: "", isActive: true }]);
    return localId;
  }

  /** 🗑: una nueva se quita sin preguntar; una guardada queda por borrar hasta guardar, y se puede restaurar (129). */
  function remove(key: string) {
    setSelected((current) => { const next = new Set(current); next.delete(key); return next; });
    if (added.some((item) => item.localId === key)) setAdded((current) => current.filter((item) => item.localId !== key));
    else setDeletes((current) => new Set(current).add(key));
  }

  function restore(key: string) {
    setDeletes((current) => { const next = new Set(current); next.delete(key); return next; });
    setServerErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  /** ↑ ↓ intercambian con la vecina a la vista; el servidor aplica los movimientos en este orden al guardar (C4). */
  function move(key: string, direction: FormCatalogMoveDirection) {
    const row = pageRows.find((item) => item.id === key);
    if (!row) return;
    const neighbor = byPosition.get(effective(row) + (direction === "Up" ? -1 : 1));
    if (!neighbor) return;
    setPositions((current) => ({ ...current, [row.id]: effective(neighbor), [neighbor.id]: effective(row) }));
    setMoves((current) => [...current, { itemId: row.id, direction }]);
  }

  function discardMoves() {
    setMoves([]);
    setPositions({});
  }

  function setActive(keys: Iterable<string>, isActive: boolean) {
    for (const key of keys) edit(key, { isActive });
  }

  function toggleSelected(key: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }

  function selectPage(all: boolean) {
    setSelected(all ? new Set(rows.filter((row) => !row.pendingDelete).map((row) => row.key)) : new Set());
  }

  /** Generar los códigos que faltan: en las opciones a la vista sin código, desde su texto, sin repetir los que ya están. */
  function generateMissingCodes() {
    const taken = new Set(rows.map((row) => row.draft.code.trim().toLocaleUpperCase()).filter(Boolean));
    for (const row of rows) {
      if (row.draft.code.trim() || !row.draft.text.trim() || row.pendingDelete) continue;
      const code = uniqueCode(codeFromText(row.draft.text), taken);
      taken.add(code);
      edit(row.key, { code });
    }
  }

  /** «Generar desde el texto» del modal: el código de esa opción, desde su texto, sin repetir el de otra. */
  function generateCode(key: string) {
    const row = rows.find((item) => item.key === key);
    if (!row || !row.draft.text.trim()) return;
    const taken = new Set(rows.filter((item) => item.key !== key && !item.pendingDelete)
      .map((item) => item.draft.code.trim().toLocaleUpperCase()).filter(Boolean));
    edit(key, { code: uniqueCode(codeFromText(row.draft.text), taken) });
  }

  function takeSnapshot(): CatalogDraftSnapshot {
    return { edits, added, deletes, selected, serverErrors };
  }

  function restoreSnapshot(snapshot: CatalogDraftSnapshot) {
    setEdits(snapshot.edits);
    setAdded(snapshot.added);
    setDeletes(snapshot.deletes);
    setSelected(snapshot.selected);
    setServerErrors(snapshot.serverErrors);
  }

  function resetDraft() {
    setEdits(emptyEdits);
    setAdded([]);
    setDeletes(new Set());
    setMoves([]);
    setPositions({});
    setSort(null);
    setSelected(new Set());
    setServerErrors({});
    setNameError(undefined);
  }

  function discard() {
    resetDraft();
    setName(undefined);
    setDescription(undefined);
    setSaveError(undefined);
  }

  function itemInput(row: CatalogRowView): FormCatalogItemInput {
    const original = pageRows.find((item) => item.id === row.itemId);
    const value = valueType === "Text"
      ? row.draft.value.trim() === "" ? null : row.draft.value
      : original && edits[row.key]?.value === undefined ? original.value ?? null : readValue(row.draft.value, valueType, format, t).canonical;
    return {
      ...(row.itemId ? { itemId: row.itemId } : { localId: row.localId }),
      code: row.draft.code,
      text: row.draft.text,
      detail: row.draft.detail.trim() === "" ? null : row.draft.detail,
      value,
      isActive: row.draft.isActive,
    };
  }

  /** El `PUT` con solo lo que cambió (C3); `null` si un valor no se puede leer y queda marcado en su campo. */
  function buildRequest(): UpdateFormCatalogRequest | null {
    const changed = rows.filter((row) => !row.pendingDelete && (row.isNew || edits[row.key]));
    if (changed.some((row) => row.errors.value && !serverErrors[row.key]?.value)) return null;
    sent.current = { items: changed.map((row) => row.key), deleteItems: [...deletes] };
    return {
      version,
      name: currentName,
      description: currentDescription.trim() === "" ? null : currentDescription,
      ...(changed.length ? { items: changed.map(itemInput) } : {}),
      ...(moves.length ? { moves: [...moves] } : {}),
      ...(sort ? { sort } : {}),
      ...(deletes.size ? { deleteItems: [...deletes] } : {}),
    };
  }

  // Cada etapa suma su motivo, con su texto en `enums.json` (FormCatalogItemUse); uno que todavía no tiene texto se ve como llega.
  const reasonLabel = (use: string) => {
    const key = `enums:FormCatalogItemUse.${use}`;
    return i18n.exists(key) ? format.formatEnum("FormCatalogItemUse", use) : use;
  };

  function applyServerErrors(error: unknown) {
    const next: Record<string, RowError> = {};
    const uses = error instanceof ApiError && Array.isArray(error.problem.uses) ? (error.problem.uses as unknown[]).filter((use): use is string => typeof use === "string") : [];
    for (const fieldError of catalogFieldErrors(error)) {
      if (fieldError.list === null && fieldError.field === "name") setNameError(fieldError.message);
      if (fieldError.index === null) continue;
      const key = fieldError.list === "items" ? sent.current.items[fieldError.index]
        : fieldError.list === "deleteItems" ? sent.current.deleteItems[fieldError.index] : undefined;
      if (!key) continue;
      const field = fieldError.field as keyof RowError;
      // `ItemInUse`: «uses» dice qué la usa; se ve el primero (los motivos vienen en el orden de su enum).
      const message = fieldError.list === "deleteItems" && uses.length
        ? `${fieldError.message} ${reasonLabel(uses[0])}`
        : fieldError.message;
      next[key] = { ...next[key], [field in { code: 1, text: 1, detail: 1, value: 1 } ? field : "row"]: message };
    }
    setServerErrors(next);
    if (Object.keys(next).length) setErrorRound((round) => round + 1);
  }

  /** Las opciones de un catálogo nuevo, para el `POST` de «Crear catálogo»; `null` si un valor no se puede leer. */
  function createItems(): FormCatalogItemInput[] | null {
    if (rows.some((row) => row.errors.value && !serverErrors[row.key]?.value)) {
      setErrorRound((round) => round + 1);
      return null;
    }
    sent.current = { items: rows.map((row) => row.key), deleteItems: [] };
    return rows.map(itemInput);
  }

  /** Un rechazo del `POST`: cada error en su campo. */
  function rejected(error: unknown) {
    setSaveError(error);
    applyServerErrors(error);
  }

  const update = useMutation({ mutationFn: (request: UpdateFormCatalogRequest) => updateCatalog(id!, request) });

  // Después de guardar: lo guardado pasa a la caché de la página a la vista, así la tabla no se vacía ni la pantalla sube.
  function keepSavedInView(request: UpdateFormCatalogRequest, nextVersion: number) {
    if (!saved) return;
    queryClient.setQueryData<FormCatalogResponse>(catalogQueryKey(saved.id), {
      ...saved, name: request.name ?? saved.name, description: request.description ?? null, version: nextVersion,
    });
    queryClient.setQueryData<PagedResultOfFormCatalogItemRow>(catalogItemsQueryKey(saved.id, itemsQuery), (current) => current && {
      ...current,
      items: current.items.filter((row) => !deletes.has(row.id)).map((row) => {
        const view = rows.find((item) => item.key === row.id);
        if (!view || !edits[row.id]) return { ...row, position: effective(row) };
        const input = itemInput(view);
        return { ...row, position: effective(row), code: input.code ?? row.code, text: input.text ?? row.text, detail: input.detail ?? null, value: input.value ?? null, isActive: input.isActive ?? row.isActive };
      }),
    });
  }

  async function save(): Promise<boolean> {
    if (!saved) return false;
    setSaveError(undefined);
    if (!currentName.trim()) {
      setNameError(t("forms:catalog.errors.nameRequired"));
      return false;
    }
    setNameError(undefined);
    const request = buildRequest();
    if (!request) {
      setErrorRound((round) => round + 1);
      return false;
    }
    try {
      const result = await update.mutateAsync(request);
      keepSavedInView(request, result.version);
      setVersion(result.version);
      resetDraft();
      setName(undefined);
      setDescription(undefined);
      void queryClient.invalidateQueries({ queryKey: catalogsQueryRoot });
      return true;
    } catch (error) {
      setSaveError(error);
      applyServerErrors(error);
      if (isCatalogConflict(error)) await openConflict();
      return false;
    }
  }

  async function openConflict() {
    if (!id) return;
    const [fresh, freshItems] = await Promise.all([fetchCatalog(id), fetchCatalogItems(id, itemsQuery)]);
    setConflict({ fresh, freshItems: freshItems.items });
  }

  /** «Ver lo nuevo»: relee el catálogo y su página y suelta lo escrito, con la versión nueva. */
  async function seeNew() {
    if (!id) return;
    setConflict(null);
    await queryClient.invalidateQueries({ queryKey: catalogQueryKey(id) });
    const fresh = await queryClient.fetchQuery({ queryKey: catalogQueryKey(id), queryFn: ({ signal }) => fetchCatalog(id, signal) });
    setVersion(fresh.version);
    discard();
  }

  /** «Seguir editando»: cierra la revisión y conserva lo escrito y la versión de la que partió. */
  function continueEditing() {
    setConflict(null);
  }

  /** «Dar de baja» o «Reactivar» el catálogo, desde el ⋮ de la banda (209): el mismo `PUT`, con su versión. */
  const setCatalogActive = useMutation({
    mutationFn: (isActive: boolean) => updateCatalog(id!, { version, isActive }),
    onSuccess: async (result) => {
      setVersion(result.version);
      discard();
      await queryClient.invalidateQueries({ queryKey: catalogsQueryRoot });
    },
  });

  return {
    catalog,
    items,
    saved,
    valueType,
    rows,
    page, setPage, pageSize, setPageSize: (size: number) => { setPageSize(size as NonNullable<CatalogItemsQuery["pageSize"]>); setPage(1); },
    searchInput, setSearchInput: (value: string) => { setSearchInput(value); setPage(1); }, searching: Boolean(search),
    name: currentName, setName: (value: string) => { setName(value); setNameError(undefined); },
    description: currentDescription, setDescription,
    nameError,
    isDirty,
    itemsDirty,
    total,
    full: total >= catalogItemsMax,
    edit, add, remove, restore, move, setActive,
    moves, discardMoves,
    deletes,
    sort, setSort, cancelSort: () => setSort(null),
    selected, toggleSelected, selectPage, clearSelection: () => setSelected(new Set()),
    generateMissingCodes, generateCode,
    takeSnapshot, restoreSnapshot, errorRound,
    save, saving: update.isPending, saveError, discard, createItems, rejected, setNameError,
    conflict, seeNew, continueEditing,
    setCatalogActive,
  };
}

export type CatalogEditor = ReturnType<typeof useCatalogEditor>;

/** «Seguimiento» → SEG; «Gran Buenos Aires» → GBA: las iniciales con tres palabras o más, y si no, las tres primeras letras. */
export function codeFromText(text: string): string {
  const words = text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  if (words.length >= 3) return words.slice(0, 3).map((word) => word[0]).join("");
  return (words[0] ?? "").slice(0, 3);
}

function uniqueCode(code: string, taken: ReadonlySet<string>): string {
  if (!taken.has(code)) return code;
  for (let n = 2; ; n += 1) if (!taken.has(`${code}${n}`)) return `${code}${n}`;
}
