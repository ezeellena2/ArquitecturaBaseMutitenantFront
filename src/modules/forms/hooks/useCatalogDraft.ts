import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { useFormat } from "@/shared/format/useFormat";
import type {
  FormCatalogItemInput,
  FormCatalogItemRow,
  FormCatalogItemSortInput,
  FormCatalogMoveDirection,
  FormCatalogPresentationDetail,
  FormCatalogResponse,
  FormCatalogValueType,
  UpdateFormCatalogRequest,
} from "../api/types";
import { catalogFieldErrors, catalogInvalidRows } from "../errors";
import { fieldColumnsOf, fieldDraftsOf, fieldInputsOf, sameFieldsDraft, sortAfterFields, type CatalogFieldErrors, type CatalogFieldsDraft } from "../lib/catalogFields";
import { defaultPresentation, normalizePresentation, placeKeys } from "../lib/catalogPresentation";
import {
  catalogRows, changedFieldsOf, cleanEdits, fieldErrorKey, itemInputOf, positionOf, savedDraft, savedRowOf,
  type CatalogDraftState, type CatalogMove, type CatalogRowView, type ItemDraft, type ItemEdits, type NewItem, type RowError,
} from "../lib/catalogDraft";
import { catalogLimits } from "../lib/catalogLimits";
import { codeFromText, editableValue, fieldDraftValue, uniqueCode, type FieldValue } from "../lib/catalogValues";
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
const fieldParts: readonly (keyof CatalogFieldErrors)[] = ["name", "key", "type", "required"];

/**
 * Lo que el servidor rechazó de un campo al guardar (E13): el campo del modal, la parte (`type`, `required`…) y su texto, y, si
 * cambiar el tipo o una regla no entra en las opciones, cuántas son y las primeras (`invalidRows`). Se dice arriba de la tabla,
 * con «Revisar», que abre el modal en ese campo.
 */
export interface CatalogFieldIssue {
  readonly localKey: string;
  readonly part: string | null;
  readonly message: string;
  readonly invalid: ReturnType<typeof catalogInvalidRows>;
}

/** Lo que frena guardar sin preguntarle al servidor: una columna de la opción o el valor de un campo. */
const isScreenCheck = (field: string) => field in itemFields || field.startsWith("field:");

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
  // Los campos (E13), cuando «Listo» del modal «Campos de …» los cambió; si no, los guardados.
  const [fieldsDraft, setFieldsDraft] = useState<CatalogFieldsDraft | null>(null);
  const [fieldIssue, setFieldIssue] = useState<CatalogFieldIssue | null>(null);
  // «En WhatsApp» (E13), cuando se cambió; si no, el guardado. Y lo que rechazó el servidor de ella (`PresentationInvalid`).
  const [presentationDraft, setPresentationDraft] = useState<FormCatalogPresentationDetail | null>(null);
  const [presentationError, setPresentationError] = useState<string | undefined>(undefined);
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
  // Desde la E13, también el orden de los campos que se mandaron: `fields.{i}` es el índice de esa lista.
  const sent = useRef<{ items: string[]; deleteItems: string[]; fields: string[] }>({ items: [], deleteItems: [], fields: [] });

  const savedFieldDetails = saved?.fields ?? [];
  const savedFields = fieldDraftsOf(savedFieldDetails, format);
  const fields = fieldsDraft ?? savedFields;
  // Los campos cuyos valores se cargan, se validan y viajan: guardados, activos en el borrador y con el mismo tipo y catálogo.
  // El valor pendiente de uno que se quitó o cambió de tipo no viaja ni frena, y vuelve si el campo queda como estaba.
  const writableFields = fieldColumnsOf(fields, savedFieldDetails).flatMap((column) => column.editable && column.detail ? [column.detail] : []);
  // Lo que puede ir a WhatsApp: los campos activos guardados que siguen en el borrador (uno nuevo todavía no tiene identidad),
  // con el tipo guardado, que es en el que están escritos sus valores: uno al que el borrador le cambió el tipo queda grisado
  // hasta guardar, y «Por ejemplo» dice lo que tiene («Capital»), nunca la identidad de su opción.
  const presentationFields = fields.fields.flatMap((field) => field.id
    ? [{ id: field.id, name: field.name, type: savedFieldDetails.find((saved) => saved.id === field.id)?.type ?? field.type }] : []);
  const presentationKeys = placeKeys({ valueType, fields: presentationFields });
  const savedPresentation = normalizePresentation(saved?.presentation ?? defaultPresentation, presentationKeys);
  const presentation = presentationDraft ? normalizePresentation(presentationDraft, presentationKeys) : savedPresentation;
  const state: CatalogDraftState = { edits, added, deletes, moves, positions, sort, serverErrors };
  const otherRows = [...extraRows, ...Object.values(touched).filter((row) => !extraRows.some((item) => item.id === row.id))];
  const invalidValues = invalidValuesOf(fieldIssue);
  const rows = catalogRows({ pageRows, extraRows: otherRows, state, valueType, showErrors: attempted, format, t, fields: savedFieldDetails, writableFields, invalidValues });
  const byPosition = new Map(pageRows.map((row) => [positionOf(state, row), row]));
  const savedRow = (key: string | undefined) => savedRowOf({ pageRows, extraRows: otherRows }, key);
  const remember = (row: FormCatalogItemRow) => setTouched((current) => current[row.id] === row ? current : { ...current, [row.id]: row });

  const fieldsDirty = fieldsDraft !== null;
  const presentationDirty = presentationDraft !== null;
  const currentName = name ?? saved?.name ?? "";
  const currentDescription = description ?? saved?.description ?? "";
  const itemsDirty = Object.keys(edits).length > 0 || added.length > 0 || deletes.size > 0 || moves.length > 0 || sort !== null;
  const isDirty = itemsDirty || fieldsDirty || presentationDirty || (saved ? currentName !== saved.name || currentDescription !== (saved.description ?? "") : false);
  const total = (saved?.itemCounts.total ?? 0) + added.length - deletes.size;

  /** Las opciones de `invalidRows` que se ven, con su motivo en la celda del campo; un campo nuevo no tiene valores. */
  function invalidValuesOf(issue: CatalogFieldIssue | null): Readonly<Record<string, RowError>> | undefined {
    const fieldId = issue ? fields.fields.find((field) => field.localKey === issue.localKey)?.id : undefined;
    if (!issue?.invalid || !fieldId) return undefined;
    return Object.fromEntries(issue.invalid.rows.filter((row) => row.itemId)
      .map((row) => [row.itemId, { [fieldErrorKey(fieldId)]: format.formatEnum("FormCatalogInvalidRowReason", row.reason) }]));
  }

  function edit(key: string, patch: ItemEdits) {
    // Cambiar un dato borra lo que el servidor dijo de él: vuelve a mandarse y el servidor decide.
    const cleared: string[] = [...Object.keys(patch).filter((field) => field !== "fields"), ...Object.keys(patch.fields ?? {}).map(fieldErrorKey)];
    setServerErrors((current) => {
      if (!current[key]) return current;
      return { ...current, [key]: Object.fromEntries(Object.entries(current[key]).filter(([field]) => !cleared.includes(field))) };
    });
    // Lo mismo con la marca de `invalidRows`: el valor nuevo se lee en la pantalla (uno ilegible frena) y el servidor decide.
    const editedFieldIds = Object.keys(patch.fields ?? {});
    if (editedFieldIds.length) setFieldIssue((current) => {
      const fieldId = current?.invalid ? fields.fields.find((field) => field.localKey === current.localKey)?.id : undefined;
      if (!current?.invalid || !fieldId || !editedFieldIds.includes(fieldId)) return current;
      return { ...current, invalid: { ...current.invalid, rows: current.invalid.rows.filter((row) => row.itemId !== key) } };
    });
    const merged = (base: ItemEdits | undefined): ItemEdits =>
      ({ ...base, ...patch, ...(patch.fields ? { fields: { ...base?.fields, ...patch.fields } } : {}) });
    if (added.some((item) => item.localId === key)) {
      setAdded((current) => current.map((item) => item.localId === key ? { ...item, ...merged(item) } : item));
      return;
    }
    const row = savedRow(key);
    if (!row) return;
    remember(row);
    setEdits((current) => {
      const clean = cleanEdits(merged(current[key]), savedDraft(row, valueType, format, savedFieldDetails));
      const rest = { ...current };
      delete rest[key];
      return Object.keys(clean).length ? { ...rest, [key]: clean } : rest;
    });
  }

  function add(): string {
    const localId = `local-${crypto.randomUUID()}`;
    setAdded((current) => [...current, { localId, code: "", text: "", detail: "", value: "", isActive: true, fields: {} }]);
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

  /** «Listo» del modal de los campos: quedan en el borrador, y si se quitó el campo del orden pendiente, el orden se cancela (224). */
  function setFields(next: CatalogFieldsDraft) {
    setFieldsDraft(sameFieldsDraft(next, savedFields) ? null : next);
    setSort((current) => sortAfterFields(current, next.fields));
    // Lo que el servidor dijo de los campos vale para los que se mandaron: cambiarlos vuelve a dejarlo en sus manos.
    setFieldIssue(null);
  }

  /** «En WhatsApp»: lo elegido queda en el borrador; volver a lo guardado lo deja sin cambios. */
  function setPresentation(next: FormCatalogPresentationDetail) {
    const normalized = normalizePresentation(next, presentationKeys);
    setPresentationDraft(JSON.stringify(normalized) === JSON.stringify(savedPresentation) ? null : normalized);
    setPresentationError(undefined);
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
        const { value, fields: values, ...rest } = patch;
        next[key] = { ...next[key], ...rest, ...(value !== undefined ? { value: editableValue(value, valueType, format) } : {}),
          ...(values ? { fields: { ...next[key]?.fields, ...editableFields(values) } } : {}) };
      }
      return next;
    });
    setAdded((current) => [...current, ...draft.added.map((item) => ({ ...item, value: editableValue(item.value, valueType, format), fields: editableFields(item.fields) }))]);
    setDeletes((current) => new Set([...current, ...draft.deletes]));
  }

  /** Los valores de los campos de la propuesta, canónicos, como se escriben en su celda (el número con la región del idioma). */
  function editableFields(values: Readonly<Record<string, FieldValue>>): Record<string, FieldValue> {
    return Object.fromEntries(Object.entries(values).map(([id, raw]) => [id, fieldDraftValue(raw, savedFieldDetails.find((field) => field.id === id)?.type, format)]));
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
    setFieldsDraft(null);
    setFieldIssue(null);
    setPresentationDraft(null);
    setPresentationError(undefined);
    setSelected(new Set());
    setServerErrors({});
    setNameError(undefined);
    setAttempted(false);
    setName(undefined);
    setDescription(undefined);
  }

  const itemInput = (row: CatalogRowView): FormCatalogItemInput =>
    itemInputOf(row, savedRow(row.itemId), edits[row.key]?.value !== undefined, valueType, format, t, edits[row.key]?.fields, writableFields);

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
  const blocked = (list: readonly (typeof rows)[number][]) => list.some((row) => (Object.keys(row.problems) as (keyof RowError)[])
    .some((field) => isScreenCheck(field) && row.problems[field] && !serverErrors[row.key]?.[field] && !invalidValues?.[row.key]?.[field]));

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
    sent.current = { items: changed.map((row) => row.key), deleteItems: [...deletes], fields: fields.fields.map((field) => field.localKey) };
    return {
      version,
      isActive,
      name: currentName,
      description: currentDescription.trim() === "" ? null : currentDescription,
      ...(changed.length ? { items: changed.map(itemInput) } : {}),
      ...(moves.length ? { moves: [...moves] } : {}),
      ...(sort ? { sort } : {}),
      ...(deletes.size ? { deleteItems: [...deletes] } : {}),
      ...fieldsRequest(),
      ...extra,
    };
  }

  /**
   * Los campos y «En WhatsApp», solo si cambiaron (E13): la lista entera de los campos, con los quitados con valores que se
   * confirmaron, y la presentación elegida. Va en el `PUT` y en el `POST` de uno nuevo.
   */
  function fieldsRequest(): Pick<UpdateFormCatalogRequest, "fields" | "confirmedFieldRemovals" | "presentation"> {
    return {
      ...(fieldsDraft ? { fields: fieldInputsOf(fieldsDraft, format, t) } : {}),
      ...(fieldsDraft?.confirmedRemovals.length ? { confirmedFieldRemovals: [...fieldsDraft.confirmedRemovals] } : {}),
      ...(presentationDraft ? { presentation } : {}),
    };
  }

  /** Las opciones de un catálogo nuevo, para el `POST` de «Crear catálogo»; `null` si algo las frena y queda marcado en su campo. */
  function createItems(): FormCatalogItemInput[] | null {
    setAttempted(true);
    if (blocked(rows)) {
      setErrorRound((round) => round + 1);
      return null;
    }
    sent.current = { items: rows.map((row) => row.key), deleteItems: [], fields: fields.fields.map((field) => field.localKey) };
    return rows.map(itemInput);
  }

  // Cada etapa suma su motivo, con su texto en `enums.json` (FormCatalogItemUse); uno que todavía no tiene texto se ve como llega.
  const reasonLabel = (use: string) => i18n.exists(`enums:FormCatalogItemUse.${use}`) ? format.formatEnum("FormCatalogItemUse", use) : use;

  // Un uso con su oración entera («No se puede borrar: la usa otra opción. Podés darla de baja.», E13) va en lugar del texto
  // genérico, no pegado a él.
  const inUseSentence = (uses: readonly string[]) => uses.find((use) => i18n.exists(`forms:catalog.errors.itemInUseBy.${use}`));

  /** Un rechazo del servidor: cada error en su campo, con el índice de lo que se mandó. */
  function applyServerErrors(error: unknown) {
    const next: Record<string, RowError> = {};
    const fieldErrors: Record<string, CatalogFieldErrors> = {};
    let issue: CatalogFieldIssue | null = null;
    const uses = error instanceof ApiError && Array.isArray(error.problem.uses) ? (error.problem.uses as unknown[]).filter((use): use is string => typeof use === "string") : [];
    let rejectedPresentation: string | undefined;
    for (const fieldError of catalogFieldErrors(error)) {
      if (fieldError.list === null && fieldError.field === "name") setNameError(fieldError.message);
      if (fieldError.field === "presentation") rejectedPresentation ??= fieldError.message;
      if (fieldError.index === null) continue;
      // Un campo del modal «Campos de …» (E13): su error va en su parte, y el primero se dice arriba de la tabla.
      if (fieldError.list === "fields") {
        const localKey = sent.current.fields[fieldError.index];
        if (!localKey) continue;
        const part = fieldParts.find((item) => item === fieldError.part) ?? "row";
        fieldErrors[localKey] = { ...fieldErrors[localKey], [part]: fieldError.message };
        issue ??= { localKey, part: fieldError.part ?? null, message: fieldError.message, invalid: catalogInvalidRows(error) };
        continue;
      }
      const key = fieldError.list === "items" ? sent.current.items[fieldError.index]
        : fieldError.list === "deleteItems" ? sent.current.deleteItems[fieldError.index] : undefined;
      if (!key) continue;
      // `ItemInUse`: «uses» dice qué la usa; se ve el primero (los motivos vienen en el orden de su enum).
      const sentence = fieldError.list === "deleteItems" ? inUseSentence(uses) : undefined;
      const message = sentence ? t(`forms:catalog.errors.itemInUseBy.${sentence}`)
        : fieldError.list === "deleteItems" && uses.length ? `${fieldError.message} ${reasonLabel(uses[0])}` : fieldError.message;
      const target = fieldError.field === "fieldValue" && fieldError.fieldId ? fieldErrorKey(fieldError.fieldId)
        : fieldError.field in itemFields ? fieldError.field : "row";
      next[key] = { ...next[key], [target]: message };
    }
    setServerErrors(next);
    setFieldIssue(issue);
    setPresentationError(rejectedPresentation);
    setFieldsDraft((current) => current && { ...current, fields: current.fields.map((field) => ({ ...field, errors: fieldErrors[field.localKey] })) });
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
    fields,
    fieldsDirty,
    setFields,
    fieldIssue,
    presentation,
    presentationFields,
    presentationDirty,
    setPresentation,
    presentationError,
    fieldsRequest,
    /** Las claves de los campos quitados: una nueva que choca con ellas suma un número. */
    removedFieldKeys: (saved?.fields ?? []).filter((field) => !field.isActive).map((field) => field.key),
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
