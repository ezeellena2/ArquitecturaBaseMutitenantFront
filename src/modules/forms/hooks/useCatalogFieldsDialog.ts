import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { FormCatalogFieldType } from "../api/types";
import {
  catalogFieldLimits, freeKey, keyFromName, newFieldDraft, rangeValueType, typedKey, type CatalogFieldDraft, type CatalogFieldErrors, type CatalogFieldsDraft,
} from "../lib/catalogFields";

/** Lo que se le cambia a un campo en el modal. */
export type FieldPatch = Partial<Omit<CatalogFieldDraft, "localKey" | "id" | "valuesCount" | "errors">>;

/** Lo que borra de los errores del servidor cambiar cada dato: el campo vuelve a mandarse y el servidor decide. */
const clearedBy: Partial<Record<keyof FieldPatch, (keyof CatalogFieldErrors)[]>> = {
  name: ["name", "row"], key: ["key"], type: ["type", "row"], sourceCatalogId: ["row"], maxLength: ["row"], min: ["row"], max: ["row"], required: ["required"],
};

/** El nombre de un campo como se lee en el modal: el escrito o «Sin nombre». */
export function useFieldName() {
  const { t } = useTranslation("forms");
  return (field: CatalogFieldDraft) => field.name.trim() || t("forms:catalog.fieldsDialog.noName");
}

/** Cómo se edita un campo en el modal: cada dato, el nombre (que lleva a la clave), la clave y el tipo. */
export interface CatalogFieldEditing {
  edit: (field: CatalogFieldDraft, patch: FieldPatch) => void;
  editName: (field: CatalogFieldDraft, next: string) => void;
  editKey: (field: CatalogFieldDraft, input: string) => void;
  editType: (field: CatalogFieldDraft, type: FormCatalogFieldType) => void;
}

/**
 * El estado del modal «Campos de …» (125): una copia de los campos que «Listo» deja en el catálogo, el campo elegido, la vista del
 * teléfono (la lista o el campo) y la pregunta de quitar uno guardado, con la confirmación de sus valores.
 */
export function useCatalogFieldsDialog({ value, removedKeys, readOnly, initialKey, onDone, onClose }: {
  value: CatalogFieldsDraft;
  removedKeys: readonly string[];
  readOnly: boolean;
  initialKey?: string | null;
  onDone: (next: CatalogFieldsDraft) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("forms");
  // Sin campos, abre en uno nuevo («Agregar campos · 0»).
  const [draft, setDraft] = useState<CatalogFieldsDraft>(() => value.fields.length || readOnly ? value : { ...value, fields: [newFieldDraft()] });
  const [selectedKey, setSelectedKey] = useState<string | null>(() => initialKey ?? draft.fields[0]?.localKey ?? null);
  const [phoneView, setPhoneView] = useState<"list" | "field">(initialKey || (!value.fields.length && !readOnly) ? "field" : "list");
  const [removing, setRemoving] = useState<CatalogFieldDraft | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // «Agregar campo» lleva el foco al nombre del nuevo, como al abrir.
  const [focusRequest, setFocusRequest] = useState(0);

  const list = draft.fields;
  const selected = list.find((field) => field.localKey === selectedKey) ?? null;
  const full = list.length >= catalogFieldLimits.active;

  const setFields = (update: (fields: readonly CatalogFieldDraft[]) => readonly CatalogFieldDraft[]) =>
    setDraft((current) => ({ ...current, fields: update(current.fields) }));

  function select(key: string) {
    setSelectedKey(key);
    setPhoneView("field");
  }

  function edit(field: CatalogFieldDraft, patch: FieldPatch) {
    const cleared = Object.keys(patch).flatMap((part) => clearedBy[part as keyof FieldPatch] ?? []);
    const errors = field.errors ? Object.fromEntries(Object.entries(field.errors).filter(([part]) => !cleared.includes(part as keyof CatalogFieldErrors))) : undefined;
    setFields((fields) => fields.map((item) => item.localKey === field.localKey ? { ...item, ...patch, errors } : item));
  }

  /** El nombre lleva a la clave mientras nadie la escribió y el campo no está guardado (130). */
  function editName(field: CatalogFieldDraft, next: string) {
    const key = field.id === null && !field.keyEdited ? (next.trim() ? freeKey(keyFromName(next), removedKeys) : "") : field.key;
    edit(field, { name: next, key });
  }

  function editKey(field: CatalogFieldDraft, input: string) {
    const key = typedKey(input);
    edit(field, key ? { key, keyEdited: true } : { key: field.name.trim() ? freeKey(keyFromName(field.name), removedKeys) : "", keyEdited: false });
  }

  /** Otro tipo deja solo lo que le sirve: el largo, el texto; el rango, un número o una fecha; el catálogo, «De un catálogo». */
  function editType(field: CatalogFieldDraft, type: FormCatalogFieldType) {
    if (type === field.type) return;
    const sameRange = rangeValueType(type) !== null && (rangeValueType(type) === "Date") === (field.type === "Date") && rangeValueType(field.type) !== null;
    edit(field, {
      type, maxLength: type === "Text" ? field.maxLength : "", min: sameRange ? field.min : "", max: sameRange ? field.max : "",
      sourceCatalogId: type === "Catalog" ? field.sourceCatalogId : null, sourceCatalogName: type === "Catalog" ? field.sourceCatalogName : null,
    });
  }

  function addField() {
    const field = newFieldDraft();
    setFields((fields) => [...fields, field]);
    select(field.localKey);
    setFocusRequest((request) => request + 1);
  }

  function moveSelected(step: -1 | 1) {
    if (!selected) return;
    setFields((fields) => {
      const index = fields.indexOf(selected), other = index + step;
      if (index < 0 || other < 0 || other >= fields.length) return fields;
      const next = [...fields];
      [next[index], next[other]] = [next[other]!, next[index]!];
      return next;
    });
  }

  function dropField(field: CatalogFieldDraft, confirmedValues: boolean) {
    const index = list.indexOf(field);
    const rest = list.filter((item) => item.localKey !== field.localKey);
    setDraft((current) => ({
      fields: current.fields.filter((item) => item.localKey !== field.localKey),
      confirmedRemovals: confirmedValues && field.id ? [...current.confirmedRemovals, field.id] : current.confirmedRemovals,
    }));
    setSelectedKey(rest[Math.min(index, rest.length - 1)]?.localKey ?? null);
    setPhoneView("list");
  }

  /** Uno nuevo se quita sin preguntar; uno guardado pregunta, y con valores pide marcar la confirmación. */
  function removeSelected() {
    if (!selected) return;
    if (selected.id === null) { dropField(selected, false); return; }
    setConfirmed(false);
    setRemoving(selected);
  }

  function answer(remove: boolean) {
    if (remove && removing) dropField(removing, removing.valuesCount > 0);
    setRemoving(null);
  }

  /** «Listo»: un campo nuevo sin nada escrito no queda; con uno nuevo, avisa que se guarde para cargarle valores. */
  function done() {
    const fields = draft.fields.filter((field) => field.id !== null || field.name.trim() !== "" || field.key !== "");
    onDone({ ...draft, fields });
    if (fields.some((field) => field.id === null)) toast.warning(t("forms:catalog.fieldsDialog.saveToLoadValues"));
    onClose();
  }

  const editing: CatalogFieldEditing = { edit, editName, editKey, editType };
  return {
    list, selected, full, phoneView, setPhoneView, removing, confirmed, setConfirmed, focusRequest, editing,
    select, addField, moveSelected, removeSelected, answer, done,
  };
}
