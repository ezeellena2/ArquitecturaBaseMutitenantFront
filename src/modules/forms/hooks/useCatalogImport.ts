import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, apiErrorMessage, isGenericApiError, toastActionError } from "@/shared/api/errorMessage";
import { pageSizes } from "@/shared/api/pageSizes";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { saveBlobAs } from "@/shared/lib/saveFile";
import { catalogQueryKey, catalogsQueryRoot, fetchCatalogTemplate, importCatalog, previewCatalogImport, type CatalogImportInput } from "../api/catalogs";
import type { FormCatalogImportMode, FormCatalogImportPreviewResponse, FormCatalogResponse } from "../api/types";
import { catalogErrorField, catalogFieldErrors, isCatalogConflict } from "../errors";
import { catalogImportColumns, pastedCsv, readPaste, type PastedSheet } from "../lib/catalogImport";
import { catalogQueryOptions } from "./useCatalogData";

export type ImportSource = "file" | "paste";
export type ImportListTab = "errors" | "added" | "changed" | "deactivated";
export const importListTabs: readonly ImportListTab[] = ["errors", "added", "changed", "deactivated"];

/** Lo que se revisa: el archivo elegido, o lo pegado como CSV, con su modo. Desde «Revisar», el origen no cambia. */
export interface ImportSubject {
  readonly file: File;
  /** El nombre que se ve en la revisión: el del archivo; lo pegado no tiene. */
  readonly fileName: string | null;
  readonly mode: NonNullable<FormCatalogImportMode>;
}

export function importListOf(preview: FormCatalogImportPreviewResponse, tab: ImportListTab) {
  return tab === "errors" ? preview.errors : tab === "added" ? preview.added : tab === "changed" ? preview.changed : preview.deactivated;
}

// Con más del 25 % de bajas, la revisión abre en «Bajas»; si no, en la primera lista que tiene algo.
function firstTab(preview: FormCatalogImportPreviewResponse): ImportListTab {
  if (preview.confirmDeactivations) return "deactivated";
  return importListTabs.find((tab) => importListOf(preview, tab).totalCount > 0) ?? "errors";
}

const sameApply = (previous: CatalogImportInput, next: CatalogImportInput) => previous.file === next.file && previous.sha256 === next.sha256
  && previous.version === next.version && previous.skipErrorRows === next.skipErrorRows && previous.confirmedDeactivations === next.confirmedDeactivations;

async function saveResponse(response: Response, fallback: string) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
  saveBlobAs(await response.blob(), match ? decodeURIComponent(match[1] ?? match[2]) : fallback);
}

/**
 * Lo que hace «Importar opciones» (120 y C7), sin la pantalla: el origen (un archivo, que reemplaza, o lo pegado, que agrega),
 * la revisión sin guardar con sus cuatro listas de a páginas, las dos confirmaciones y aplicar el mismo archivo con su SHA-256
 * y su versión. Cada error va en un solo lugar: el de un archivo, en su campo; uno de negocio, en la franja; red, 5xx y 429,
 * en el aviso de abajo. Si otra persona guardó, «Revisar de nuevo» con la versión de ahora; con otra importación en curso,
 * solo «Cerrar».
 */
export function useCatalogImport(catalog: FormCatalogResponse, { onClose, onCatalogChanged }: { onClose: () => void; onCatalogChanged: () => void }) {
  const { t } = useTranslation(["forms", "common"]);
  const queryClient = useQueryClient();
  const columns = catalogImportColumns(catalog.valueType);

  const [source, setSource] = useState<ImportSource>("file");
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState<PastedSheet | null>(null);
  const [originError, setOriginError] = useState<string>();
  const [subject, setSubject] = useState<ImportSubject | null>(null);
  const [version, setVersion] = useState(catalog.version);
  const [review, setReview] = useState<FormCatalogImportPreviewResponse | null>(null);
  const [tab, setTab] = useState<ImportListTab>("errors");
  const [confirmDeactivations, setConfirmDeactivations] = useState(false);
  const [confirmErrors, setConfirmErrors] = useState(false);
  // El error que dice la franja, ya en palabras: de un pedido, lo que no avisó el MutationCache; de releer el catálogo, todo.
  const [failure, setFailure] = useState<{ error: unknown; text: string | null }>();
  const [busy, setBusy] = useState(false);
  const stale = useRef(false);

  // Red, 5xx y 429 los avisa el MutationCache; un rechazo de negocio (sin permiso, el módulo apagado), un aviso (errores).
  const downloadTemplate = useMutation({
    mutationFn: async () => saveResponse(await fetchCatalogTemplate(catalog.valueType), `${t("forms:catalog.templateFile")}.xlsx`),
    onError: (error) => toastActionError(error, t),
  });
  const preview = useMutation({ mutationFn: (input: Parameters<typeof previewCatalogImport>[1]) => previewCatalogImport(catalog.id, input) });
  const apply = useIdempotentMutation((input: CatalogImportInput, key) => importCatalog(catalog.id, input, key), { sameOperation: sameApply });
  const conflict = isCatalogConflict(failure?.error) || (failure?.error instanceof ApiError && failure.error.code === "Forms.CatalogImport.FileChanged");

  function rejected(error: unknown) {
    if (catalogErrorField(error) === "file") {
      // El archivo no se pudo leer: se puede elegir otro.
      setOriginError(catalogFieldErrors(error).find((item) => item.field === "file")?.message ?? actionErrorMessage(error, t) ?? "");
      setSubject(null);
      setReview(null);
      return;
    }
    if (isCatalogConflict(error)) stale.current = true;
    if (error instanceof ApiError && error.code === "Forms.CatalogImport.Busy") setBusy(true);
    // Sin conexión, 5xx y 429 ya los avisó el MutationCache.
    if (!isGenericApiError(error)) setFailure({ error, text: isCatalogConflict(error) ? t("forms:catalog.import.conflict") : actionErrorMessage(error, t) });
  }

  function run(next: ImportSubject, nextVersion: number, page: number, pageSize: number, first: boolean) {
    setFailure(undefined);
    preview.mutate({ file: next.file, mode: next.mode, version: nextVersion, page, pageSize }, {
      onSuccess: (response) => {
        setReview(response);
        if (first) {
          setTab(firstTab(response));
          setConfirmDeactivations(false);
          setConfirmErrors(false);
        }
      },
      onError: rejected,
    });
  }

  function submitReview() {
    setOriginError(undefined);
    if (source === "file") {
      if (!file) { setOriginError(t("forms:catalog.import.fileRequired")); return; }
      const next: ImportSubject = { file, fileName: file.name, mode: "Replace" };
      setSubject(next);
      run(next, version, 1, pageSizes[0], true);
      return;
    }
    if (!sheet?.rows.length) { setOriginError(t("forms:catalog.import.pasteRequired")); return; }
    const csv = new File([pastedCsv(sheet)], t("forms:catalog.import.pastedFileName"), { type: "text/csv" });
    const next: ImportSubject = { file: csv, fileName: null, mode: "Append" };
    setSubject(next);
    run(next, version, 1, pageSizes[0], true);
  }

  /**
   * «Revisar de nuevo»: con la versión de ahora, el mismo archivo o lo mismo pegado. La relectura del catálogo dice su error
   * en la franja del diálogo y solo ahí (`silent`), también sin conexión.
   */
  async function reviewAgain() {
    if (!subject) return;
    setFailure(undefined);
    try {
      const fresh = await queryClient.fetchQuery({ ...catalogQueryOptions(catalog.id), staleTime: 0 });
      setVersion(fresh.version);
      run(subject, fresh.version, 1, review?.errors.pageSize ?? pageSizes[0], true);
    } catch (error) {
      setFailure({ error, text: apiErrorMessage(error, t) });
    }
  }

  function changePage(page: number, pageSize: number) {
    if (subject) run(subject, version, page, pageSize, false);
  }

  function chooseTab(next: ImportListTab) {
    setTab(next);
    if (review && review.errors.page !== 1) changePage(1, review.errors.pageSize);
  }

  function submitApply() {
    if (!subject || !review) return;
    setFailure(undefined);
    apply.mutate({
      file: subject.file, mode: subject.mode, version: review.version, sha256: review.sha256,
      skipErrorRows: review.errors.totalCount > 0,
      confirmedDeactivations: review.confirmDeactivations && confirmDeactivations ? review.deactivated.totalCount : 0,
    }, {
      onSuccess: (result) => {
        toast.success(t("forms:catalog.import.imported"));
        // La versión que respondió pasa ya a la ficha: si se vuelve a importar antes de que el editor termine de releer, la
        // revisión va con ella y no con la de antes, que daría 409 (como `keepSavedInView` al guardar).
        queryClient.setQueryData<FormCatalogResponse>(catalogQueryKey(catalog.id), (current) => current && { ...current, version: result.version });
        void queryClient.invalidateQueries({ queryKey: catalogsQueryRoot });
        onCatalogChanged();
        onClose();
      },
      onError: rejected,
    });
  }

  function close() {
    if (apply.isPending) return;
    if (stale.current) onCatalogChanged();
    onClose();
  }

  return {
    columns,
    source,
    chooseSource: (next: ImportSource) => { if (next !== source) { setSource(next); setOriginError(undefined); } },
    file,
    chooseFile: (chosen: File) => { setFile(chosen); setOriginError(undefined); },
    sheet,
    paste: (text: string) => { const read = readPaste(text, columns); setSheet(read); if (read?.rows.length) setOriginError(undefined); },
    clearSheet: () => setSheet(null),
    originError,
    /** Desde «Revisar», el origen no cambia. */
    locked: subject !== null,
    subject,
    review,
    tab,
    chooseTab,
    changePage,
    confirmDeactivations, setConfirmDeactivations,
    confirmErrors, setConfirmErrors,
    failureText: failure?.text ?? null,
    hasFailure: failure !== undefined,
    conflict,
    busy,
    reviewing: preview.isPending && review === null,
    refreshing: preview.isPending && review !== null,
    previewPending: preview.isPending,
    applying: apply.isPending,
    submitReview,
    reviewAgain,
    submitApply,
    close,
    downloadTemplate: () => downloadTemplate.mutate(),
  };
}

export type CatalogImport = ReturnType<typeof useCatalogImport>;
