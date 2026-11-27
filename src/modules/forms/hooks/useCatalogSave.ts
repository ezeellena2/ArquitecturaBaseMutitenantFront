import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  catalogConflictQueryKey, catalogItemsQueryRoot, catalogQueryKey, catalogsQueryRoot, fetchCatalog, fetchCatalogItems, updateCatalog,
} from "../api/catalogs";
import type { FormCatalogItemRow, FormCatalogResponse, PagedResultOfFormCatalogItemRow, UpdateFormCatalogRequest } from "../api/types";
import { isCatalogConflict } from "../errors";
import type { CatalogData } from "./useCatalogData";
import type { CatalogDraft } from "./useCatalogDraft";

/** Lo guardado ahora, para la revisión lado a lado de un 409 (138): la ficha y la página que se ve. */
export interface CatalogConflict {
  readonly fresh: FormCatalogResponse;
  readonly freshItems: readonly FormCatalogItemRow[];
}

/** Lo que suma un catálogo con filtros al guardar: sus filtros y su persona de ejemplo, y cómo quedan para la caché. */
export interface CatalogSaveExtra {
  readonly request: Partial<UpdateFormCatalogRequest>;
  readonly view: Partial<FormCatalogResponse>;
}

/**
 * Guardar un catálogo: «Guardar cambios» manda el `PUT` con la versión de la lectura con la que arrancó el editor y, al
 * entrar, deja lo guardado en la caché de las páginas leídas (la tabla no se vacía ni la pantalla sube, 160). Lo que sigue
 * al guardado va en el `onSuccess` del pedido, así «Reintentar» del aviso termina igual (errores). Un 409 abre la revisión
 * con lo guardado ahora, leído por TanStack Query; si esa lectura falla, el 409 se ve en su cartel de siempre.
 */
export function useCatalogSave(id: string | undefined, data: CatalogData, draft: CatalogDraft) {
  const queryClient = useQueryClient();
  const { saved, itemsQuery } = data;
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [saveError, setSaveError] = useState<unknown>(undefined);
  // La revisión de un 409: abierta o no, y su vuelta, que sube con cada 409 así cada uno lee de nuevo lo guardado ahora.
  const [conflictRound, setConflictRound] = useState(0);
  const [conflictOpen, setConflictOpen] = useState(false);

  // La versión con la que se guarda es la de la lectura con la que arrancó el editor; una relectura no la cambia (concurrencia).
  if (saved && version === undefined) setVersion(saved.version);

  const conflictQuery = useQuery({
    queryKey: catalogConflictQueryKey(id ?? "", conflictRound, itemsQuery),
    queryFn: async ({ signal }): Promise<CatalogConflict> => {
      const [fresh, freshItems] = await Promise.all([fetchCatalog(id!, signal), fetchCatalogItems(id!, itemsQuery, signal)]);
      return { fresh, freshItems: freshItems.items };
    },
    enabled: Boolean(id) && conflictOpen,
    staleTime: Infinity,
    gcTime: 0,
    // Si no se puede leer, lo dice el cartel del 409 (`conflictUnreadable`), no un aviso aparte.
    meta: { silent: true },
  });

  // «Guardar cambios» y «Dar de baja» o «Reactivar» son el mismo `PUT` (C3); cada uno con su pedido, para su «Guardando…».
  const update = useMutation({ mutationFn: (request: UpdateFormCatalogRequest) => updateCatalog(id!, request) });
  const activation = useMutation({ mutationFn: (request: UpdateFormCatalogRequest) => updateCatalog(id!, request) });

  // Después de guardar: lo guardado pasa a la caché de la ficha y de cada página o búsqueda leída, no solo de la que se ve: lo
  // cambiado en otra página o antes de buscar se ve con su valor nuevo al volver, sin pasar por el viejo mientras se relee.
  function keepSavedInView(request: UpdateFormCatalogRequest, nextVersion: number, view: Partial<FormCatalogResponse>, rows = draft.rows,
    edits = draft.edits, deletes = draft.deletes) {
    if (!saved) return;
    queryClient.setQueryData<FormCatalogResponse>(catalogQueryKey(saved.id), {
      ...saved, name: request.name ?? saved.name, description: request.description ?? null, isActive: request.isActive ?? saved.isActive,
      version: nextVersion, ...view,
    });
    queryClient.setQueriesData<PagedResultOfFormCatalogItemRow>({ queryKey: catalogItemsQueryRoot(saved.id) }, (current) => current && {
      ...current,
      items: current.items.filter((row) => !deletes.has(row.id)).map((row) => {
        const shown = rows.find((item) => item.key === row.id);
        if (!shown || !edits[row.id]) return { ...row, position: draft.positionOf(row) };
        const input = draft.itemInput(shown);
        return { ...row, position: draft.positionOf(row), code: input.code ?? row.code, text: input.text ?? row.text, detail: input.detail ?? null, value: input.value ?? null, isActive: input.isActive ?? row.isActive };
      }),
    });
  }

  /**
   * El `PUT` con lo pendiente y el `isActive` que corresponde. `false` si no salió (falta el nombre o un valor no se puede
   * leer: queda marcado en su campo). `onSaved` recibe la versión que respondió, también si entró con «Reintentar».
   */
  function send(mutation: typeof update, isActive: boolean, extra: CatalogSaveExtra | undefined, onSaved?: (version: number) => void,
    onSettled?: () => void): boolean {
    if (!saved) return false;
    setSaveError(undefined);
    if (!draft.attempt()) return false;
    const request = draft.buildRequest(version, isActive, extra?.request);
    if (!request) return false;
    // Lo que se ve al mandar: lo guardado se arma con esto aunque entre más tarde.
    const { rows, edits, deletes } = draft;
    mutation.mutate(request, {
      onSuccess: (result) => {
        keepSavedInView(request, result.version, extra?.view ?? {}, rows, edits, deletes);
        setVersion(result.version);
        draft.reset();
        void queryClient.invalidateQueries({ queryKey: catalogsQueryRoot });
        onSaved?.(result.version);
      },
      onError: (error) => {
        setSaveError(error);
        draft.applyServerErrors(error);
        if (isCatalogConflict(error)) {
          setConflictRound((round) => round + 1);
          setConflictOpen(true);
        }
      },
      onSettled,
    });
    return true;
  }

  /** «Guardar cambios». Un catálogo con filtros suma `extra`. */
  function save(extra?: CatalogSaveExtra, onSaved?: (version: number) => void) {
    send(update, saved?.isActive ?? true, extra, onSaved);
  }

  /**
   * «Dar de baja» o «Reactivar» el catálogo, desde el ⋮ de la banda (209): el mismo guardado, con lo pendiente y su versión,
   * y lo que rechaza va donde va lo de guardar. `false` si no salió.
   */
  function setCatalogActive(isActive: boolean, extra: CatalogSaveExtra | undefined, onSaved?: (version: number) => void, onSettled?: () => void) {
    return send(activation, isActive, extra, onSaved, onSettled);
  }

  /** Un rechazo del `POST` de un catálogo nuevo: cada error en su campo. */
  function rejected(error: unknown) {
    setSaveError(error);
    draft.applyServerErrors(error);
  }

  function discard() {
    draft.reset();
    setSaveError(undefined);
  }

  /** «Ver lo nuevo»: relee el catálogo y su página y suelta lo escrito, con la versión nueva; devuelve lo leído. */
  async function seeNew(): Promise<FormCatalogResponse | undefined> {
    if (!id) return undefined;
    setConflictOpen(false);
    await queryClient.invalidateQueries({ queryKey: catalogQueryKey(id) });
    const fresh = await queryClient.fetchQuery({ queryKey: catalogQueryKey(id), queryFn: ({ signal }) => fetchCatalog(id, signal) });
    setVersion(fresh.version);
    discard();
    return fresh;
  }

  return {
    save,
    saving: update.isPending,
    saveError,
    rejected,
    discard,
    conflict: conflictOpen ? conflictQuery.data ?? null : null,
    /** Lo guardado ahora no se pudo leer: el 409 va en el cartel de siempre, con «Ver lo nuevo» y «Seguir editando». */
    conflictUnreadable: conflictOpen && conflictQuery.isError,
    seeNew,
    /** «Seguir editando»: cierra la revisión y conserva lo escrito y la versión de la que partió. */
    continueEditing: () => setConflictOpen(false),
    setCatalogActive,
    activating: activation.isPending,
  };
}
