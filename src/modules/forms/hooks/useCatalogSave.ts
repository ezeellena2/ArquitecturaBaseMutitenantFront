import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  catalogConflictQueryKey, catalogItemsQueryKey, catalogQueryKey, catalogsQueryRoot, fetchCatalog, fetchCatalogItems, updateCatalog,
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
 * entrar, deja lo guardado en la caché de la página a la vista (la tabla no se vacía ni la pantalla sube, 160). Lo que sigue
 * al guardado va en el `onSuccess` del pedido, así «Reintentar» del aviso termina igual (errores). Un 409 abre la revisión
 * con lo guardado ahora, leído por TanStack Query; si esa lectura falla, el 409 se ve en su cartel de siempre.
 */
export function useCatalogSave(id: string | undefined, data: CatalogData, draft: CatalogDraft) {
  const queryClient = useQueryClient();
  const { saved, itemsQuery } = data;
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [saveError, setSaveError] = useState<unknown>(undefined);
  // La revisión abierta: cada 409 lee de nuevo lo guardado ahora.
  const [conflictRound, setConflictRound] = useState<number | null>(null);

  // La versión con la que se guarda es la de la lectura con la que arrancó el editor; una relectura no la cambia (concurrencia).
  if (saved && version === undefined) setVersion(saved.version);

  const conflictQuery = useQuery({
    queryKey: catalogConflictQueryKey(id ?? "", conflictRound ?? 0, itemsQuery),
    queryFn: async ({ signal }): Promise<CatalogConflict> => {
      const [fresh, freshItems] = await Promise.all([fetchCatalog(id!, signal), fetchCatalogItems(id!, itemsQuery, signal)]);
      return { fresh, freshItems: freshItems.items };
    },
    enabled: Boolean(id) && conflictRound !== null,
    staleTime: Infinity,
    gcTime: 0,
    // Si no se puede leer, lo dice el cartel del 409 (`conflictUnreadable`), no un aviso aparte.
    meta: { silent: true },
  });

  const update = useMutation({ mutationFn: (request: UpdateFormCatalogRequest) => updateCatalog(id!, request) });

  // Después de guardar: lo guardado pasa a la caché de la ficha y de la página a la vista.
  function keepSavedInView(request: UpdateFormCatalogRequest, nextVersion: number, view: Partial<FormCatalogResponse>, rows = draft.rows,
    edits = draft.edits, deletes = draft.deletes) {
    if (!saved) return;
    queryClient.setQueryData<FormCatalogResponse>(catalogQueryKey(saved.id), {
      ...saved, name: request.name ?? saved.name, description: request.description ?? null, version: nextVersion, ...view,
    });
    queryClient.setQueryData<PagedResultOfFormCatalogItemRow>(catalogItemsQueryKey(saved.id, itemsQuery), (current) => current && {
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
   * «Guardar cambios». Un catálogo con filtros suma `extra`. `onSaved` recibe la versión que respondió el guardado, también
   * si entró con «Reintentar».
   */
  function save(extra?: CatalogSaveExtra, onSaved?: (version: number) => void) {
    if (!saved) return;
    setSaveError(undefined);
    if (!draft.attempt()) return;
    const request = draft.buildRequest(version, extra?.request);
    if (!request) return;
    // Lo que se ve al mandar: lo guardado se arma con esto aunque entre más tarde.
    const { rows, edits, deletes } = draft;
    update.mutate(request, {
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
        if (isCatalogConflict(error)) setConflictRound((round) => (round ?? 0) + 1);
      },
    });
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
    setConflictRound(null);
    await queryClient.invalidateQueries({ queryKey: catalogQueryKey(id) });
    const fresh = await queryClient.fetchQuery({ queryKey: catalogQueryKey(id), queryFn: ({ signal }) => fetchCatalog(id, signal) });
    setVersion(fresh.version);
    discard();
    return fresh;
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
    save,
    saving: update.isPending,
    saveError,
    rejected,
    discard,
    conflict: conflictRound !== null ? conflictQuery.data ?? null : null,
    /** Lo guardado ahora no se pudo leer: el 409 va en el cartel de siempre, con «Ver lo nuevo» y «Seguir editando». */
    conflictUnreadable: conflictRound !== null && conflictQuery.isError,
    seeNew,
    /** «Seguir editando»: cierra la revisión y conserva lo escrito y la versión de la que partió. */
    continueEditing: () => setConflictRound(null),
    setCatalogActive,
  };
}
