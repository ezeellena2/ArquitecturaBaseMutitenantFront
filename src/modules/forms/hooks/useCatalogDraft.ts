import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { useFormat } from "@/shared/format/useFormat";
import type {
  FormCatalogItemInput,
  FormCatalogItemRow,
  FormCatalogItemSortInput,
  FormCatalogMoveDirection,
  FormCatalogResponse,
  FormCatalogValueType,
  UpdateFormCatalogRequest,
} from "../api/types";
import { catalogFieldErrors } from "../errors";
import {
  catalogRows, changedFieldsOf, cleanEdits, itemInputOf, positionOf, savedDraft, savedRowOf,
  type CatalogDraftState, type CatalogMove, type CatalogRowView, type ItemDraft, type ItemEdits, type ItemField, type NewItem, type RowError,
} from "../lib/catalogDraft";
import { catalogLimits } from "../lib/catalogLimits";
import { codeFromText, editableValue, uniqueCode } from "../lib/catalogValues";
import type { CatalogProposalDraft } from "../lib/proposal";

/** Las opciones del borrador como estaban al abrir el modal de opciones: «Cancelar» o Esc las devuelven así (117). */
export interface CatalogDraftSnapshot {
  readonly edits: Readonly<Record<string, ItemEdits>>;
  readonly added: readonly NewItem[];
  readonly deletes: ReadonlySet<string>;
  readonly selected: ReadonlySet<string>;
  readonly serverErrors: Readonly<Record<string, RowError>>;
}

const emptyEdits: Readonly<Record<string, ItemEdits>> = {};
const itemFields = { code: 1, text: 1, detail: 1, value: 1 } as const;

/**
 * El borrador del editor de un catálogo (C3): el nombre, la descripción y las opciones cambiadas, las nuevas, las que se
 * borran al guardar, los movimientos y el orden pendientes, sobre la página que se ve. Da las filas con sus errores (los de
 * la pantalla, recién después de intentar guardar) y arma lo que viaja: el `PUT` con solo lo que cambió, o las opciones del
 * `POST`. No lee ni escribe en el servidor.
 */
export function useCatalogDraft({ pageRows, extraRows, saved, valueType }: {
  pageRows: readonly FormCatalogItemRow[];
  extraRows: readonly FormCatalogItemRow[];
  saved: FormCatalogResponse | undefined;
  valueType: FormCatalogValueType;
}) {
  const { t, i18n } = useTranslation(["forms", "common"]);
  const format = useFormat();

  const [name, setName] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [edits, setEdits] = useState<Readonly<Record<string, ItemEdits>>>(emptyEdits);
  const [added, setAdded] = useState<readonly NewItem[]>([]);
  const [deletes, setDeletes] = useState<ReadonlySet<string>>(new Set());
  const [moves, setMoves] = useState<readonly CatalogMove[]>([]);
  const [positions, setPositions] = useState<Readonly<Record<string, number>>>({});
  const [sort, setSort] = useState<FormCatalogItemSortInput | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [serverErrors, setServerErrors] = useState<Readonly<Record<string, RowError>>>({});
  // Las guardadas que el borrador cambió o borra, como se leyeron: desde otra página o con otra búsqueda siguen a la vista,
  // viajan al guardar y muestran su rechazo, como las de una propuesta.
  const [touched, setTouched] = useState<Readonly<Record<string, FormCatalogItemRow>>>({});
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  // Antes de intentar guardar, nada va en rojo, tampoco una fila recién agregada (formularios, 2026-10-24).
  const [attempted, setAttempted] = useState(false);
  // Sube cada vez que guardar encuentra un error en las opciones: el modal se abre en la primera con problemas (117).
  const [errorRound, setErrorRound] = useState(0);
  // Lo que se mandó: el índice de un error de `items[i]` o `deleteItems[i]` es el del pedido, no el de la tabla.
  const sent = useRef<{ items: string[]; deleteItems: string[] }>({ items: [], deleteItems: [] });

  const state: CatalogDraftState = { edits, added, deletes, moves, positions, sort, serverErrors };
  const otherRows = [...extraRows, ...Object.values(touched).filter((row) => !extraRows.some((item) => item.id === row.id))];
  const rows = catalogRows({ pageRows, extraRows: otherRows, state, valueType, showErrors: attempted, format, t });
  const byPosition = new Map(pageRows.map((row) => [positionOf(state, row), row]));
  const savedRow = (key: string | undefined) => savedRowOf({ pageRows, extraRows: otherRows }, key);
  const remember = (row: FormCatalogItemRow) => setTouched((current) => current[row.id] === row ? current : { ...current, [row.id]: row });

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
    const row = savedRow(key);
    if (!row) return;
    remember(row);
    setEdits((current) => {
      const clean = cleanEdits({ ...current[key], ...patch }, savedDraft(row, valueType, format));
      const rest = { ...current };
      delete rest[key];
      return Object.keys(clean).length ? { ...rest, [key]: clean } : rest;
    });
  }

  function add(): string {
    const localId = `local-${crypto.randomUUID()}`;
    setAdded((current) => [...current, { localId, code: "", text: "", detail: "", value: "", isActive: true }]);
    return localId;
  }

  /** 🗑: una nueva se quita sin preguntar; una guardada queda por borrar hasta guardar, y se puede restaurar (129). */
  function remove(key: string) {
    setSelected((current) => { const next = new Set(current); next.delete(key); return next; });
    if (added.some((item) => item.localId === key)) {
      setAdded((current) => current.filter((item) => item.localId !== key));
      return;
    }
    const row = savedRow(key);
    if (row) remember(row);
    setDeletes((current) => new Set(current).add(key));
  }

  function restore(key: string) {
    setDeletes((current) => { const next = new Set(current); next.delete(key); return next; });
    setServerErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  /** ↑ ↓ intercambian con la vecina a la vista; el servidor aplica los movimientos en este orden al guardar (C4). */
  function move(key: string, direction: FormCatalogMoveDirection) {
    const row = pageRows.find((item) => item.id === key);
    if (!row) return;
    const neighbor = byPosition.get(positionOf(state, row) + (direction === "Up" ? -1 : 1));
    if (!neighbor) return;
    setPositions((current) => ({ ...current, [row.id]: positionOf(state, neighbor), [neighbor.id]: positionOf(state, row) }));
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

  /**
   * Lo que propone el asistente (catalogoptions.edit@1), sin guardar: lo que cambia en cada guardada, las nuevas y las que
   * se borran al guardar. Las guardadas de otras páginas que toca llegan por `extraRows`. Desde ahí se editan como siempre.
   */
  function propose(draft: CatalogProposalDraft) {
    setEdits((current) => {
      const next = { ...current };
      for (const [key, patch] of Object.entries(draft.changes)) {
        const { value, ...rest } = patch;
        next[key] = { ...next[key], ...rest, ...(value !== undefined ? { value: editableValue(value, valueType, format) } : {}) };
      }
      return next;
    });
    setAdded((current) => [...current, ...draft.added.map((item) => ({ ...item, value: editableValue(item.value, valueType, format) }))]);
    setDeletes((current) => new Set([...current, ...draft.deletes]));
  }

  /** Quita las opciones del borrador (otro origen o tipo en un catálogo nuevo, después de preguntar), sin tocar el nombre. */
  function clearItems() {
    setTouched({});
    setEdits(emptyEdits);
    setAdded([]);
    setDeletes(new Set());
    setSelected(new Set());
    setServerErrors({});
  }

  /** Vuelve a lo guardado: las opciones, el nombre, la descripción y los errores. */
  function reset() {
    setTouched({});
    setEdits(emptyEdits);
    setAdded([]);
    setDeletes(new Set());
    setMoves([]);
    setPositions({});
    setSort(null);
    setSelected(new Set());
    setServerErrors({});
    setNameError(undefined);
    setAttempted(false);
    setName(undefined);
    setDescription(undefined);
  }

  const itemInput = (row: CatalogRowView): FormCatalogItemInput =>
    itemInputOf(row, savedRow(row.itemId), edits[row.key]?.value !== undefined, valueType, format, t);

  /** Un intento de guardar: desde acá se ven los errores de la pantalla. `false` si falta el nombre. */
  function attempt(): boolean {
    setAttempted(true);
    if (currentName.trim()) {
      setNameError(undefined);
      return true;
    }
    setNameError(t("forms:catalog.errors.nameRequired"));
    return false;
  }

  /**
   * Lo que frena el guardado sin preguntarle al servidor (117): un código repetido, un texto, un código o un detalle más largo
   * que su tope, o un valor que no se puede leer. Queda marcado en su campo y el modal se abre en la primera con problemas. El
   * texto repetido avisa sin frenar, y lo que rechazó el servidor no frena: se vuelve a mandar y él decide.
   */
  const blocked = (list: readonly (typeof rows)[number][]) =>
    list.some((row) => (Object.keys(itemFields) as ItemField[]).some((field) => row.problems[field] && !serverErrors[row.key]?.[field]));

  /**
   * El `PUT` con solo lo que cambió (C3), siempre con el nombre, la versión e `isActive`, que el contrato exige: «Guardar
   * cambios» manda el estado de ahora; «Dar de baja» y «Reactivar», el nuevo, con lo pendiente. `null` si algo lo frena y queda
   * marcado en su campo.
   */
  function buildRequest(version: number | undefined, isActive: boolean, extra: Partial<UpdateFormCatalogRequest> = {}): UpdateFormCatalogRequest | null {
    const changed = rows.filter((row) => !row.pendingDelete && (row.isNew || edits[row.key]));
    if (blocked(changed)) {
      setErrorRound((round) => round + 1);
      return null;
    }
    sent.current = { items: changed.map((row) => row.key), deleteItems: [...deletes] };
    return {
      version,
      isActive,
      name: currentName,
      description: currentDescription.trim() === "" ? null : currentDescription,
      ...(changed.length ? { items: changed.map(itemInput) } : {}),
      ...(moves.length ? { moves: [...moves] } : {}),
      ...(sort ? { sort } : {}),
      ...(deletes.size ? { deleteItems: [...deletes] } : {}),
      ...extra,
    };
  }

  /** Las opciones de un catálogo nuevo, para el `POST` de «Crear catálogo»; `null` si algo las frena y queda marcado en su campo. */
  function createItems(): FormCatalogItemInput[] | null {
    setAttempted(true);
    if (blocked(rows)) {
      setErrorRound((round) => round + 1);
      return null;
    }
    sent.current = { items: rows.map((row) => row.key), deleteItems: [] };
    return rows.map(itemInput);
  }

  // Cada etapa suma su motivo, con su texto en `enums.json` (FormCatalogItemUse); uno que todavía no tiene texto se ve como llega.
  const reasonLabel = (use: string) => i18n.exists(`enums:FormCatalogItemUse.${use}`) ? format.formatEnum("FormCatalogItemUse", use) : use;

  /** Un rechazo del servidor: cada error en su campo, con el índice de lo que se mandó. */
  function applyServerErrors(error: unknown) {
    const next: Record<string, RowError> = {};
    const uses = error instanceof ApiError && Array.isArray(error.problem.uses) ? (error.problem.uses as unknown[]).filter((use): use is string => typeof use === "string") : [];
    for (const fieldError of catalogFieldErrors(error)) {
      if (fieldError.list === null && fieldError.field === "name") setNameError(fieldError.message);
      if (fieldError.index === null) continue;
      const key = fieldError.list === "items" ? sent.current.items[fieldError.index]
        : fieldError.list === "deleteItems" ? sent.current.deleteItems[fieldError.index] : undefined;
      if (!key) continue;
      // `ItemInUse`: «uses» dice qué la usa; se ve el primero (los motivos vienen en el orden de su enum).
      const message = fieldError.list === "deleteItems" && uses.length ? `${fieldError.message} ${reasonLabel(uses[0])}` : fieldError.message;
      next[key] = { ...next[key], [fieldError.field in itemFields ? fieldError.field : "row"]: message };
    }
    setServerErrors(next);
    if (Object.keys(next).length) setErrorRound((round) => round + 1);
  }

  return {
    rows: rows as readonly CatalogRowView[],
    savedRow,
    name: currentName,
    setName: (value: string) => { setName(value); setNameError(undefined); },
    description: currentDescription,
    setDescription,
    nameError,
    setNameError,
    isDirty,
    itemsDirty,
    total,
    full: total >= catalogLimits.items,
    edits,
    deletes,
    moves,
    sort,
    setSort,
    cancelSort: () => setSort(null),
    selected,
    toggleSelected,
    selectPage,
    clearSelection: () => setSelected(new Set()),
    edit, add, remove, restore, move, discardMoves, setActive, propose,
    changedFields: (key: string): (keyof ItemDraft)[] => changedFieldsOf(state, key),
    generateMissingCodes, generateCode,
    takeSnapshot, restoreSnapshot, errorRound,
    attempt, buildRequest, createItems, applyServerErrors, itemInput, reset, clearItems,
    positionOf: (row: FormCatalogItemRow) => positionOf(state, row),
  };
}

export type CatalogDraft = ReturnType<typeof useCatalogDraft>;
