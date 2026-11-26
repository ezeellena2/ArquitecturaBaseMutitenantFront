import type { AssistantActionContract, AssistantActionContractField } from "@/shared/api/generated/assistant-actions";
import type { AssistantProposalValueResponse } from "@/shared/api/types";

// ADR 0068 §4 y §9: la propuesta trae un valor por campo simple y una operación por elemento de una lista, cada uno con
// su nombre leído del servidor y su duda («Revisá»):
// - un campo simple lleva el valor (el id, si es una opción o un registro);
// - un `Choices` lleva { op: "add" | "remove", id }, uno por elemento, así cada rol tiene su nombre y su duda;
// - un `Items` lleva { op: "add" | "change" | "remove", key, row? }, una fila por su clave.
// Editar nunca reemplaza una lista entera: la pantalla aplica las operaciones sobre lo que leyó al abrir.

export interface AssistantProposalOption {
  readonly id: string;
  readonly label: string;
}

export interface AssistantProposalRow {
  readonly key: string;
  readonly label?: string;
  readonly values: Readonly<Record<string, unknown>>;
}

export interface AssistantProposalFieldValue {
  readonly value: unknown;
  /** El nombre de una opción o un registro, leído del servidor o de la pantalla. */
  readonly label?: string;
}

/** Lo que muestra la pantalla: los campos simples, las listas (`Choices`) y las filas (`Items`). */
export interface AssistantProposalValues {
  readonly fields: Readonly<Record<string, AssistantProposalFieldValue>>;
  readonly lists: Readonly<Record<string, readonly AssistantProposalOption[]>>;
  readonly rows: Readonly<Record<string, readonly AssistantProposalRow[]>>;
}

export const emptyAssistantProposalValues: AssistantProposalValues = { fields: {}, lists: {}, rows: {} };

interface OperationBase {
  readonly field: string;
  readonly label?: string;
  readonly doubt?: string;
}

export type AssistantProposalOperation =
  | (OperationBase & { readonly kind: "set"; readonly value: unknown })
  | (OperationBase & { readonly kind: "add" | "remove"; readonly id: string })
  | (OperationBase & { readonly kind: "addRow" | "changeRow"; readonly key: string; readonly row: Readonly<Record<string, unknown>> })
  | (OperationBase & { readonly kind: "removeRow"; readonly key: string });

/** «Lo que cambia»: lo que se suma, lo que se quita y lo que cambia, contado sobre lo que la pantalla leyó al abrir. */
export interface AssistantProposalChanges {
  readonly fields: readonly { readonly field: string; readonly before?: AssistantProposalFieldValue; readonly after: AssistantProposalFieldValue }[];
  readonly lists: readonly { readonly field: string; readonly added: readonly AssistantProposalOption[]; readonly removed: readonly AssistantProposalOption[] }[];
  readonly rows: readonly {
    readonly field: string;
    readonly added: readonly AssistantProposalRow[];
    readonly removed: readonly AssistantProposalRow[];
    readonly changed: readonly { readonly before: AssistantProposalRow; readonly after: AssistantProposalRow }[];
  }[];
}

const textTypes = new Set(["text", "longText", "email", "phone", "taxId"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const nonEmptyText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** Si un valor simple entra en su campo, con el tipo y los límites del contrato. Una opción o un registro sin nombre no se puede mostrar. */
function fits(field: AssistantActionContractField, value: unknown, label: string | undefined): boolean {
  if (value === null) return !field.required;
  if (textTypes.has(field.type)) return typeof value === "string" && (field.maxLength === undefined || value.length <= field.maxLength);
  switch (field.type) {
    case "integer":
    case "decimal":
      return typeof value === "number" && Number.isFinite(value) && (field.type === "decimal" || Number.isInteger(value))
        && (field.minimum === undefined || value >= field.minimum) && (field.maximum === undefined || value <= field.maximum);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return typeof value === "string" && datePattern.test(value);
    case "money":
      return isRecord(value) && nonEmptyText(value.currency) && (typeof value.amount === "number" || typeof value.amount === "string");
    case "choice":
    case "record":
      return nonEmptyText(value) && nonEmptyText(label);
    default:
      return false;
  }
}

function rowFits(field: AssistantActionContractField, row: unknown): row is Record<string, unknown> {
  if (!isRecord(row)) return false;
  return Object.entries(row).every(([name, value]) => {
    const inner = field.itemFields?.find((candidate) => candidate.name === name);
    return inner !== undefined && inner.type !== "items" && inner.type !== "choices" && inner.type !== "consent"
      && (inner.type === "choice" || inner.type === "record" ? value === null || nonEmptyText(value) : fits(inner, value, undefined));
  });
}

function decodeValue(field: AssistantActionContractField, entry: AssistantProposalValueResponse): AssistantProposalOperation | undefined {
  const base = { field: field.name, label: entry.label ?? undefined, doubt: entry.doubt ?? undefined };
  const value: unknown = entry.value;
  if (field.type === "consent") return undefined;
  if (field.type === "choices") {
    if (!isRecord(value) || (value.op !== "add" && value.op !== "remove") || !nonEmptyText(value.id)) return undefined;
    if (value.op === "add" && !nonEmptyText(base.label)) return undefined;
    return { ...base, kind: value.op, id: value.id };
  }
  if (field.type === "items") {
    if (!isRecord(value) || !nonEmptyText(value.key)) return undefined;
    if (value.op === "remove") return { ...base, kind: "removeRow", key: value.key };
    if ((value.op !== "add" && value.op !== "change") || !rowFits(field, value.row)) return undefined;
    return { ...base, kind: value.op === "add" ? "addRow" : "changeRow", key: value.key, row: value.row };
  }
  return fits(field, value, base.label) ? { ...base, kind: "set", value } : undefined;
}

const identity = (operation: AssistantProposalOperation) =>
  operation.kind === "set" ? operation.field : `${operation.field}:${"id" in operation ? operation.id : operation.key}`;

/**
 * Las operaciones de una propuesta, o `undefined` si un valor no se puede mostrar en la pantalla: un campo que la acción
 * no declara, un valor que no entra en su campo, un consentimiento o dos operaciones sobre lo mismo.
 */
export function decodeAssistantProposal(action: AssistantActionContract, values: readonly AssistantProposalValueResponse[]): readonly AssistantProposalOperation[] | undefined {
  const operations: AssistantProposalOperation[] = [];
  const seen = new Set<string>();
  for (const entry of values) {
    const field = action.fields.find((candidate) => candidate.name === entry.field);
    const operation = field && decodeValue(field, entry);
    if (!operation || seen.has(identity(operation))) return undefined;
    seen.add(identity(operation));
    operations.push(operation);
  }
  return operations;
}

/**
 * Aplica las operaciones sobre lo leído al abrir (al crear, sobre nada). Devuelve `undefined` si no entra: quitar o
 * cambiar al crear, o una lista que pasa su tope. Sumar lo que ya está o quitar lo que no está no cambia nada.
 */
export function applyAssistantProposal(action: AssistantActionContract, current: AssistantProposalValues, operations: readonly AssistantProposalOperation[]): AssistantProposalValues | undefined {
  const fields = { ...current.fields };
  const lists = { ...current.lists };
  const rows = { ...current.rows };
  for (const operation of operations) {
    if (action.kind === "create" && operation.kind !== "set" && operation.kind !== "add" && operation.kind !== "addRow") return undefined;
    switch (operation.kind) {
      case "set":
        fields[operation.field] = { value: operation.value, label: operation.label };
        break;
      case "add": {
        const list = lists[operation.field] ?? [];
        if (!list.some((option) => option.id === operation.id)) lists[operation.field] = [...list, { id: operation.id, label: operation.label ?? "" }];
        break;
      }
      case "remove":
        lists[operation.field] = (lists[operation.field] ?? []).filter((option) => option.id !== operation.id);
        break;
      case "addRow":
      case "changeRow": {
        const list = rows[operation.field] ?? [];
        const existing = list.find((row) => row.key === operation.key);
        if (existing) {
          const changed = { key: existing.key, label: operation.label ?? existing.label, values: { ...existing.values, ...operation.row } };
          rows[operation.field] = list.map((row) => (row === existing ? changed : row));
        } else if (operation.kind === "addRow") {
          rows[operation.field] = [...list, { key: operation.key, label: operation.label, values: operation.row }];
        }
        break;
      }
      case "removeRow":
        rows[operation.field] = (rows[operation.field] ?? []).filter((row) => row.key !== operation.key);
        break;
    }
  }
  const overflows = action.fields.some((field) => field.maxItems !== undefined
    && ((field.type === "choices" && (lists[field.name]?.length ?? 0) > field.maxItems)
      || (field.type === "items" && (rows[field.name]?.length ?? 0) > field.maxItems)));
  return overflows ? undefined : { fields, lists, rows };
}

function sameJson(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) return left.length === right.length && left.every((item, index) => sameJson(item, right[index]));
  if (isRecord(left) && isRecord(right)) {
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every((key) => key in right && sameJson(left[key], right[key]));
  }
  return false;
}

/** «Lo que cambia» entre lo leído y lo que queda, en el orden de los campos de la acción. Solo los campos que cambian. */
export function assistantProposalChanges(action: AssistantActionContract, current: AssistantProposalValues, next: AssistantProposalValues): AssistantProposalChanges {
  const fields: AssistantProposalChanges["fields"][number][] = [];
  const lists: AssistantProposalChanges["lists"][number][] = [];
  const rows: AssistantProposalChanges["rows"][number][] = [];
  for (const { name, type } of action.fields) {
    if (type === "choices") {
      const before = current.lists[name] ?? [];
      const after = next.lists[name] ?? [];
      const added = after.filter((option) => !before.some((old) => old.id === option.id));
      const removed = before.filter((option) => !after.some((kept) => kept.id === option.id));
      if (added.length || removed.length) lists.push({ field: name, added, removed });
    } else if (type === "items") {
      const before = current.rows[name] ?? [];
      const after = next.rows[name] ?? [];
      const added = after.filter((row) => !before.some((old) => old.key === row.key));
      const removed = before.filter((row) => !after.some((kept) => kept.key === row.key));
      const changed = after.flatMap((row) => {
        const old = before.find((candidate) => candidate.key === row.key);
        return old && !sameJson(old.values, row.values) ? [{ before: old, after: row }] : [];
      });
      if (added.length || removed.length || changed.length) rows.push({ field: name, added, removed, changed });
    } else {
      const after = next.fields[name];
      const before = current.fields[name];
      if (after && !sameJson(before?.value, after.value)) fields.push({ field: name, before, after });
    }
  }
  return { fields, lists, rows };
}

/** La duda («Revisá») de cada valor: por campo, o por campo y elemento en una lista o una fila. */
export function assistantProposalDoubts(operations: readonly AssistantProposalOperation[]): ReadonlyMap<string, string> {
  return new Map(operations.flatMap((operation) => (operation.doubt ? [[identity(operation), operation.doubt] as const] : [])));
}

export const doubtKey = (field: string, item?: string) => (item === undefined ? field : `${field}:${item}`);
