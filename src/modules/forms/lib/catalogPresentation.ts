import type { FormatState } from "@/shared/format/useFormat";
import type { FormCatalogFieldType, FormCatalogItemRow, FormCatalogPresentationDetail, FormCatalogPresentationIssue, FormCatalogValueType } from "../api/types";
import type { ItemDraft } from "./catalogDraft";
import { catalogLimits } from "./catalogLimits";
import { displayValue, fieldDraftText, fieldValueText, readValue } from "./catalogValues";

/**
 * «En WhatsApp» de un catálogo a mano (E13): qué arma el título y la descripción de cada opción. Cada uno es una lista de
 * lugares (`text`, `code`, `value`, `detail` o `field:<id>`), unidos con « · », como los arma el servidor
 * (`FormCatalogPresentation` y `FormCatalogPresentationBuilder`): los lugares sin contenido no cuentan, el título tiene hasta
 * 30 caracteres y contenido, y la descripción hasta 300. Los topes son los del texto y el detalle de una opción, del contrato.
 */
export const presentationSeparator = " · ";

/** «En WhatsApp» de un catálogo nuevo, y de uno dado de alta antes de la E13: el texto en el título y el detalle debajo (0060). */
export const defaultPresentation: FormCatalogPresentationDetail = { title: ["text"], description: ["detail"] };

const fieldPrefix = "field:";

/** Lo que lee cada lugar: el tipo del valor del catálogo y los campos activos guardados, en su orden. */
export interface PresentationSource {
  readonly valueType: FormCatalogValueType;
  readonly fields: readonly { readonly id: string; readonly type: FormCatalogFieldType }[];
  /** La opción de otro catálogo que es valor de un campo «De un catálogo», para decir su texto (`useCatalogFieldSources`). */
  readonly sourceItem?: (itemId: string) => { readonly text: string } | undefined;
}

/** El título y la descripción de una opción, como se ven en WhatsApp, y lo que no entra. */
export interface BuiltPresentation {
  readonly title: string;
  readonly description: string;
  readonly issue: FormCatalogPresentationIssue | null;
}

/** Lo que dice un lugar en una opción, ya formateado; vacío si no tiene contenido. */
export type PlaceText = (place: string) => string;

export const fieldPlace = (fieldId: string) => `${fieldPrefix}${fieldId}`;
export const fieldIdOfPlace = (place: string) => place.startsWith(fieldPrefix) ? place.slice(fieldPrefix.length) : null;

/** Los lugares que se pueden elegir, en el orden del catálogo (285): texto, código, el valor si es tipado, los campos y el detalle. */
export function placeKeys(source: { readonly valueType: FormCatalogValueType; readonly fields: readonly { readonly id: string }[] }): string[] {
  return ["text", "code", ...(source.valueType === "Text" ? [] : ["value"]), ...source.fields.map((field) => fieldPlace(field.id)), "detail"];
}

/** Lo elegido en el orden del catálogo, sin repetir y sin los lugares que ya no están. */
export function orderedPlaces(places: readonly string[], keys: readonly string[]): string[] {
  const chosen = new Set(places);
  return keys.filter((key) => chosen.has(key));
}

/** Sin los lugares que ya no están (un campo quitado); si el título se queda sin ninguno, vuelve al texto, como el servidor. */
export function normalizePresentation(presentation: FormCatalogPresentationDetail, keys: readonly string[]): FormCatalogPresentationDetail {
  const known = new Set(keys);
  const keep = (places: readonly string[]) => [...new Set(places)].filter((place) => known.has(place));
  const title = keep(presentation.title);
  return { title: title.length ? title : ["text"], description: keep(presentation.description) };
}

/** Une los lugares con contenido con « · » y dice si el título o la descripción no entran. */
export function buildPresentation(presentation: FormCatalogPresentationDetail, text: PlaceText): BuiltPresentation {
  const join = (places: readonly string[]) => places.map((place) => text(place).trim()).filter(Boolean).join(presentationSeparator);
  const title = join(presentation.title);
  const description = join(presentation.description);
  const issue: FormCatalogPresentationIssue | null = title === "" ? "TitleEmpty"
    : title.length > catalogLimits.itemText ? "TitleTooLong"
      : description.length > catalogLimits.itemDetail ? "DescriptionTooLong" : null;
  return { title, description, issue };
}

/** Una opción para el teléfono de al lado (`PreviewOption` de `CatalogPreviewPhone`): su título, su descripción y lo que no entra. */
export function presentedOption(key: string, presentation: FormCatalogPresentationDetail, text: PlaceText) {
  const built = buildPresentation(presentation, text);
  return { key, text: built.title, detail: built.description || null, issue: built.issue };
}

const ignoreErrors = (key: string) => key;

/** Lo que dice cada lugar en una opción guardada, con sus valores canónicos. */
export function savedPlaceText(row: Pick<FormCatalogItemRow, "text" | "code" | "detail" | "value" | "fields">, source: PresentationSource,
  format: FormatState): PlaceText {
  return (place) => {
    if (place === "text") return row.text;
    if (place === "code") return row.code;
    if (place === "detail") return row.detail ?? "";
    if (place === "value") return displayValue(row.value, source.valueType, format);
    const field = source.fields.find((item) => item.id === fieldIdOfPlace(place));
    if (!field) return "";
    const raw = row.fields[field.id];
    return fieldValueText(raw, field.type, format, typeof raw === "string" ? source.sourceItem?.(raw)?.text : undefined);
  };
}

/**
 * Lo que dice cada lugar en una opción del borrador: lo escrito, leído como se guardaría («15000» se ve «15.000»); lo que
 * no se puede leer todavía, como está escrito, así la vista previa no lo pierde.
 */
export function draftPlaceText(draft: ItemDraft, source: PresentationSource, format: FormatState): PlaceText {
  return (place) => {
    if (place === "text") return draft.text;
    if (place === "code") return draft.code;
    if (place === "detail") return draft.detail;
    if (place === "value") {
      const read = readValue(draft.value, source.valueType, format, ignoreErrors);
      return read.error ? draft.value : displayValue(read.canonical, source.valueType, format);
    }
    const field = source.fields.find((item) => item.id === fieldIdOfPlace(place));
    if (!field) return "";
    const value = draft.fields?.[field.id] ?? null;
    return fieldDraftText(value, field.type, format, typeof value === "string" ? source.sourceItem?.(value)?.text : undefined);
  };
}
