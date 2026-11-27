import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { catalogPreviewQueryKey, fetchMembersSource, membersSourceQueryKey, previewCatalog } from "../api/catalogs";
import type {
  FormCatalogFilters as SavedFilters,
  FormCatalogFilterSortInput,
  FormCatalogFiltersInput,
  FormCatalogPreviewRequest,
  FormCatalogResponse,
  FormCatalogSample,
  FormCatalogSource,
  FormCatalogSourceColumn,
  FormCatalogSourceResponse,
} from "../api/types";
import { catalogFieldErrors } from "../errors";

/** Hasta cuántas condiciones, unidas con «y» (§4 y §4b de la spec). */
export const conditionsMax = 10;

/** Las columnas de «Miembros» cuyos valores son ids de la organización: un id que ya no está deja el catálogo sin usar. */
export const referenceColumns = ["role", "company"] as const;
const isReferenceColumn = (column: string) => (referenceColumns as readonly string[]).includes(column);

/**
 * «Contactos» no publica su definición (solo sus etiquetas): sus columnas son las de la §4b, con su versión 1. «Miembros» la
 * lee de `sources/members`.
 */
export const contactsSource: FormCatalogSourceResponse = {
  version: 1,
  columns: [
    { key: "name", type: "Text", operators: [], canDetail: false, canSort: true },
    { key: "tags", type: "List", operators: ["hasAny", "hasNone"], canDetail: true, canSort: false },
  ],
};

export interface ConditionDraft {
  readonly key: string;
  readonly column: string;
  readonly operator: string;
  readonly values: readonly string[];
}

export interface FiltersDraft {
  readonly conditions: readonly ConditionDraft[];
  readonly excludeRecipient: boolean;
  readonly detail: string | null;
  readonly sort: { readonly column: string; readonly descending: boolean } | null;
}

interface State {
  readonly source: FormCatalogSource;
  readonly draft: FiltersDraft;
  readonly sample: FormCatalogSample | null;
  /** El nombre de cada rol o empresa elegida: lo trae el detalle y lo suma la pieza al elegir. */
  readonly names: Readonly<Record<string, string>>;
}

let conditionSeed = 0;
const nextKey = () => `c${++conditionSeed}`;

function savedDraft(source: FormCatalogSource, saved: FormCatalogResponse | undefined): FiltersDraft {
  const filters = saved?.source === source ? saved.filters : undefined;
  if (!filters) return { conditions: [], excludeRecipient: source === "Members", detail: null, sort: { column: "name", descending: false } };
  return {
    conditions: filters.conditions.map((condition) => ({ key: nextKey(), column: condition.column, operator: condition.operator, values: condition.values })),
    excludeRecipient: filters.excludeRecipient,
    detail: filters.detail ?? null,
    sort: filters.sort ? { column: filters.sort.column, descending: filters.sort.descending } : null,
  };
}

function initial(source: FormCatalogSource, saved: FormCatalogResponse | undefined): State {
  const same = saved?.source === source;
  const names: Record<string, string> = {};
  for (const reference of same ? [...saved.roles ?? [], ...saved.companies ?? []] : []) names[reference.id] = reference.name;
  return { source, draft: savedDraft(source, saved), sample: same ? saved.sample ?? null : null, names };
}

/** Lo que define un filtro, sin las claves de la pantalla: dos borradores iguales dan el mismo texto. */
function signature(draft: FiltersDraft, sampleId: string | null | undefined): string {
  return JSON.stringify([draft.conditions.map(({ column, operator, values }) => [column, operator, values]), draft.excludeRecipient,
    draft.detail ?? null, draft.sort ?? null, sampleId ?? null]);
}

const hasValues = (condition: ConditionDraft) => condition.values.some((value) => value.trim() !== "");

/** Los filtros como se guardan: los mismos datos que el pedido y que la respuesta, con todos sus campos. */
function toSaved(draft: FiltersDraft, conditions: readonly ConditionDraft[], version: number): SavedFilters {
  return {
    sourceVersion: version,
    conditions: conditions.map(({ column, operator, values }) => ({ column, operator, values: [...values] })),
    excludeRecipient: draft.excludeRecipient,
    detail: draft.detail,
    sort: draft.sort,
  };
}

function toInput(draft: FiltersDraft, conditions: readonly ConditionDraft[], version: number): FormCatalogFiltersInput {
  const saved = toSaved(draft, conditions, version);
  return { ...saved, sort: saved.sort as FormCatalogFilterSortInput | null };
}

/** Una condición nueva: la primera lista de la fuente (roles o etiquetas), con su primer operador. */
function newCondition(columns: readonly FormCatalogSourceColumn[]): ConditionDraft | null {
  const column = columns.find((candidate) => candidate.type === "List" && candidate.operators.length > 0)
    ?? columns.find((candidate) => candidate.operators.length > 0);
  return column ? { key: nextKey(), column: column.key, operator: column.operators[0]!, values: column.type === "Boolean" ? ["true"] : [] } : null;
}

/**
 * Los filtros de un catálogo de los miembros o de los contactos (FRM-Catalogo-Filtros y FRM-Catalogo-Contactos): el borrador
 * de sus condiciones, el detalle, el orden, «Sin incluir a quien lo recibe» y la persona o el cliente de ejemplo, que se
 * guarda con el catálogo. La vista previa se pide sola al cambiar algo (§7, flujo 6), sin «Probar»; con miembros y condiciones,
 * solo con una persona elegida, porque sin ella el servidor responde `SampleRequired`.
 */
export function useCatalogFilters({ source, saved, canManage, error, sampleRequiredMessage }: {
  source: FormCatalogSource;
  saved?: FormCatalogResponse;
  canManage: boolean;
  /** El rechazo de guardar o de crear: cada condición y la persona marcan su error. */
  error: unknown;
  sampleRequiredMessage: string;
}) {
  const filtered = source !== "Manual";
  const [state, setState] = useState<State>(() => initial(source, saved));
  // Otro origen en un catálogo nuevo empieza de cero.
  if (state.source !== source) setState(initial(source, saved));
  const [seenError, setSeenError] = useState<unknown>(error);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  const [sampleMissing, setSampleMissing] = useState(false);
  // El índice de un error de `conditions[i]` es el de lo que se mandó.
  const [sent, setSent] = useState<readonly string[]>([]);
  if (error !== seenError) {
    setSeenError(error);
    setDismissed(new Set());
  }

  const members = useQuery({
    queryKey: membersSourceQueryKey, queryFn: ({ signal }) => fetchMembersSource(signal),
    enabled: source === "Members" && canManage, staleTime: Infinity, meta: { silent: true },
  });
  const definition = source === "Members" ? members.data : source === "Contacts" ? contactsSource : undefined;
  const version = definition?.version ?? saved?.filters?.sourceVersion;
  const columns = definition?.columns ?? [];

  const { draft, sample, names } = state;
  const missingValues = (condition: ConditionDraft) => isReferenceColumn(condition.column)
    ? condition.values.filter((value) => !Object.hasOwn(names, value)) : [];

  const original = initial(source, saved);
  const isDirty = filtered && signature(draft, sample?.id) !== signature(original.draft, original.sample?.id);

  const fieldErrors = catalogFieldErrors(error);
  const conditionErrors: Record<string, string> = {};
  let sampleError = sampleMissing ? sampleRequiredMessage : undefined;
  for (const fieldError of fieldErrors) {
    if (fieldError.list === "conditions" && fieldError.index !== null) {
      const key = sent[fieldError.index];
      if (key && !dismissed.has(key)) conditionErrors[key] ??= fieldError.message;
    }
    if (fieldError.field === "sample" && !dismissed.has("sample")) sampleError ??= fieldError.message;
  }

  const sampleField = (id: string | null | undefined) => source === "Members" ? { sampleMemberId: id ?? null } : { sampleContactId: id ?? null };

  // La vista previa usa solo las condiciones completas y sin ids que ya no están: las demás las marca el guardado.
  const ready = draft.conditions.filter((condition) => hasValues(condition) && missingValues(condition).length === 0);
  const waitingForSample = source === "Members" && ready.length > 0 && !sample;
  const request: FormCatalogPreviewRequest | null = filtered && version !== undefined && !waitingForSample
    ? { source, filters: toInput(draft, ready, version), ...sampleField(sample?.id) }
    : null;
  const requestText = request ? JSON.stringify(request) : null;
  const debouncedText = useDebouncedValue(requestText);
  const debounced = debouncedText ? JSON.parse(debouncedText) as FormCatalogPreviewRequest : null;
  const preview = useQuery({
    queryKey: catalogPreviewQueryKey(debounced ?? { source }),
    queryFn: ({ signal }) => previewCatalog(debounced!, signal),
    enabled: debounced !== null, staleTime: 30_000, meta: { silent: true },
  });

  function change(next: (draft: FiltersDraft) => FiltersDraft) {
    setState((current) => ({ ...current, draft: next(current.draft) }));
  }

  function dismiss(key: string) {
    setDismissed((current) => current.has(key) ? current : new Set([...current, key]));
  }

  return {
    filtered,
    source,
    definition,
    columns,
    draft,
    sample,
    names,
    isDirty,
    canAddCondition: columns.length > 0 && draft.conditions.length < conditionsMax,
    /** Las columnas de «Miembros» no se pudieron leer: lo dice su lugar, con «Reintentar». */
    columnsLoad: { error: source === "Members" && members.isError ? members.error : undefined, retry: () => { void members.refetch(); } },
    conditionErrors,
    sampleError,
    missingValues,
    addCondition() {
      const condition = newCondition(columns);
      if (condition && draft.conditions.length < conditionsMax) change((current) => ({ ...current, conditions: [...current.conditions, condition] }));
    },
    /** Una condición nueva sin sumarla: en el teléfono se arma en «Editar condición» y entra con «Listo». */
    newCondition: () => draft.conditions.length < conditionsMax ? newCondition(columns) : null,
    appendCondition(condition: ConditionDraft) {
      change((current) => current.conditions.length < conditionsMax ? { ...current, conditions: [...current.conditions, condition] } : current);
    },
    updateCondition(key: string, patch: Partial<Omit<ConditionDraft, "key">>) {
      dismiss(key);
      change((current) => ({ ...current, conditions: current.conditions.map((condition) => condition.key === key ? { ...condition, ...patch } : condition) }));
    },
    removeCondition(key: string) {
      change((current) => ({ ...current, conditions: current.conditions.filter((condition) => condition.key !== key) }));
    },
    setExcludeRecipient(excludeRecipient: boolean) { change((current) => ({ ...current, excludeRecipient })); },
    setDetail(detail: string | null) { change((current) => ({ ...current, detail })); },
    setSort(sort: FiltersDraft["sort"]) { change((current) => ({ ...current, sort })); },
    setSample(next: FormCatalogSample | null) {
      dismiss("sample");
      setSampleMissing(false);
      setState((current) => ({ ...current, sample: next }));
    },
    /** La pieza suma el nombre de cada rol o empresa que se elige, para mostrarlo y guardarlo en la vista. */
    learn(references: readonly { id: string; name: string }[]) {
      if (references.every((reference) => names[reference.id] === reference.name)) return;
      setState((current) => ({ ...current, names: { ...current.names, ...Object.fromEntries(references.map((reference) => [reference.id, reference.name])) } }));
    },
    /** Sin persona de ejemplo no se crea ni se guarda uno de miembros con condiciones (`SampleRequired`, «Elegí una persona.»). */
    checkSample(): boolean {
      const missing = source === "Members" && draft.conditions.length > 0 && !sample;
      setSampleMissing(missing);
      return !missing;
    },
    /** Los filtros y la persona o el cliente de ejemplo, para el `POST` o el `PUT`. */
    request(): { filters: FormCatalogFiltersInput; sampleMemberId?: string | null; sampleContactId?: string | null } | null {
      if (!filtered || version === undefined) return null;
      setSent(draft.conditions.map((condition) => condition.key));
      return { filters: toInput(draft, draft.conditions, version), ...sampleField(sample?.id) };
    },
    /** Lo guardado, para la caché del detalle: así el borrador vuelve a coincidir sin releerlo. */
    savedView(): Partial<FormCatalogResponse> {
      if (!filtered || version === undefined) return {};
      const used = (column: string) => [...new Set(draft.conditions.filter((condition) => condition.column === column).flatMap((condition) => condition.values))]
        .filter((id) => Object.hasOwn(names, id)).map((id) => ({ id, name: names[id]! }));
      return { filters: toSaved(draft, draft.conditions, version), roles: used("role"), companies: used("company"), sample };
    },
    /** «Descartar» vuelve a lo guardado; «Ver lo nuevo», a lo que se acaba de leer. */
    reset(fresh: FormCatalogResponse | undefined = saved) {
      setState(initial(source, fresh));
      setSampleMissing(false);
      setDismissed(new Set());
    },
    preview: {
      data: debounced && request ? preview.data : undefined,
      updating: request !== null && (preview.isFetching || requestText !== debouncedText),
      waitingForSample,
      /** La vista previa no se pudo pedir: lo dice el teléfono, con «Reintentar». */
      error: debounced && request && preview.isError ? preview.error : undefined,
      retry: () => { void preview.refetch(); },
    },
  };
}

export type CatalogFilters = ReturnType<typeof useCatalogFilters>;
