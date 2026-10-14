import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { DetailGrid, type DetailGridItem } from "@/shared/ui/DetailGrid";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { SearchSelect } from "@/shared/ui/SearchSelect";
import type { WhatsAppImportPreviewResponse } from "../../api/types";
import { contactsQueryRoot, contactTagOptions, fetchImportSample, importContacts, previewImport, type ImportContactsInput } from "../api/contacts";
import { importErrorField } from "../errors";
import { saveResponseAs } from "../lib/saveFile";
import { FileInput } from "./FileInput";

/** El ejemplo y lo que se importa: decisión técnica 10 (ClosedXML lee los dos). */
const acceptedFiles = ".xlsx,.csv";
// «Sin etiqueta» es la opción vacía del desplegable: la etiqueta es optativa.
const noTag = "";

const sameImport = (previous: ImportContactsInput, next: ImportContactsInput) => previous.file === next.file && previous.tag === next.tag;

/**
 * «Importar contactos» (tableros WA-Contactos-Importar y M-WA-Contactos-Importar): el archivo, con «Descargar ejemplo», y
 * una etiqueta para todos. Al elegir el archivo, la vista previa dice cuántos entran sin guardar nada (CC05) y, si hay
 * filas que no entran, cuáles y por qué. Importar es un alta idempotente: un reintento sin conexión manda la misma clave.
 */
export function ImportContactsDialog({ onClose, returnFocusTo }: { onClose: () => void; returnFocusTo?: HTMLElement | null }) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const { phone } = useAppChrome();
  const queryClient = useQueryClient();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState(noTag);
  const [fileError, setFileError] = useState<string>();
  const tagOptions = useResourceOptions(contactTagOptions);
  const { failure, clear, fail, close } = useDialogFailure(onClose, contactsQueryRoot);
  const sample = useMutation({ mutationFn: async () => saveResponseAs(await fetchImportSample(), t("whatsapp:contacts.import.sampleFileName")) });
  const preview = useMutation({ mutationFn: previewImport });
  const importer = useIdempotentMutation((input: ImportContactsInput, key) => importContacts(input, key), { sameOperation: sameImport });

  // Lo que el back rechaza del archivo (no es un .xlsx o .csv, o tiene demasiadas filas) va debajo de «Archivo».
  function rejected(error: unknown) {
    if (importErrorField(error) && error instanceof ApiError) setFileError(error.detail ?? "");
    else fail(error);
  }

  function choose(next: File | null) {
    setFile(next);
    setFileError(undefined);
    clear();
    preview.reset();
    if (next) preview.mutate({ file: next, tag: tag || null }, { onError: rejected });
  }

  function submit() {
    clear();
    if (!file) { setFileError(t("whatsapp:contacts.import.fileRequired")); return; }
    importer.mutate({ file, tag: tag || null }, {
      onSuccess: async (result) => {
        toast.success(t("whatsapp:contacts.import.done", { count: result.imported }));
        onClose();
        await queryClient.invalidateQueries({ queryKey: contactsQueryRoot });
      },
      onError: rejected,
    });
  }

  const summary = preview.data && !fileError ? preview.data : undefined;
  const tagOption = (value: string) => ({ value, label: value });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("whatsapp:contacts.import.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("whatsapp:contacts.import.file")} required error={fileError}
            aside={<button type="button" onClick={() => sample.mutate()} disabled={sample.isPending}
              className="inline-flex items-center gap-1.5 rounded-[6px] text-[12.5px] font-semibold text-[var(--marca-tx)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--foco)] disabled:opacity-60 max-md:text-[13.5px]">
              <Download aria-hidden="true" className="size-3.5" />{t("whatsapp:contacts.import.sample")}
            </button>}>
            <FileInput accept={acceptedFiles} fileName={file?.name ?? null} placeholder={t("whatsapp:contacts.import.noFile")}
              action={t(file ? "whatsapp:contacts.import.change" : "whatsapp:contacts.import.choose")} onFile={choose} />
          </FormField>
          <FormField label={t("whatsapp:contacts.import.tag")}>
            <SearchSelect value={tag} onChange={(next) => { setTag(next); clear(); }} remote={tagOptions.remote}
              options={[{ value: noTag, label: t("whatsapp:contacts.import.noTag") }, ...tagOptions.items.map(tagOption)]}
              selectedLabel={tag || t("whatsapp:contacts.import.noTag")}
              placeholder={t("whatsapp:contacts.import.noTag")} searchLabel={t("common:actions.search")} />
          </FormField>
          {summary && summary.rejected.totalCount > 0 ? <ImportPreview preview={summary} phone={phone} /> : null}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" pending={importer.isPending} pendingLabel={t("whatsapp:contacts.import.importing")}>
            {summary ? t("whatsapp:contacts.import.submitCount", { count: summary.rows }) : t("whatsapp:contacts.import.submit")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

/// Tablero WA-Contactos-Importar («Con filas que no entran», .e11-dg): cuántos entran (nuevos y que ya estaban), cuántas
/// filas no y, de cada una, por qué. Los totales y los motivos los da el back.
function ImportPreview({ preview, phone }: { preview: WhatsAppImportPreviewResponse; phone: boolean }) {
  const { t } = useTranslation("whatsapp");
  const items: DetailGridItem[] = [
    { key: "rows", label: t("contacts.import.toImport"), value: t("contacts.import.toImportValue", { count: preview.rows, new: preview.new, updated: preview.updated }) },
    { key: "rejected", label: t("contacts.import.rejected"), value: <span className="font-semibold text-[var(--peligro)]">{t("contacts.import.rejectedRows", { count: preview.rejected.totalCount })}</span> },
    ...preview.rejected.items.map((rejection) => ({ key: `row-${rejection.row}`, label: t("contacts.import.row", { row: rejection.row }), value: rejection.reason })),
  ];
  return <div className="-mx-5 -mb-4 md:-mb-5"><DetailGrid items={items} phone={phone} /></div>;
}
