import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AttachmentPrimitive, ComposerPrimitive, useAuiState } from "@assistant-ui/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { FileSizeText } from "@/shared/ui/format/FileSizeText";
import { FormField } from "@/shared/ui/FormField";
import { CloseIcon, SendIcon } from "@/shared/ui/icons";
import { FileText, Paperclip } from "lucide-react";
import { useFormat } from "@/shared/format/useFormat";

import { assistantAttachmentTypes, type AssistantAttachmentLimits, type PendingAssistantFile } from "../lib/assistantFiles";

function FilePreview({ file }: { file: File }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return file.type.startsWith("image/") ? <img ref={ref} alt="" className="size-7 rounded-md object-cover" />
    : file.type === "application/pdf" ? <FileText aria-hidden="true" className="size-5 shrink-0" /> : null;
}

const FilesContext = createContext<{ files: readonly PendingAssistantFile[]; errorId?: string; pending: boolean }>({ files: [], pending: false });

function ComposerFile() {
  const attachment = useAuiState((state) => state.attachment);
  const { files, errorId, pending } = useContext(FilesContext);
  const { t } = useTranslation("assistant");
  const owned = files.find((item) => item.id === attachment.id);
  if (!owned) return null;
  const { file, invalid, id } = owned;
  return <AttachmentPrimitive.Root asChild><li aria-describedby={invalid && errorId ? `${errorId}-${id}` : undefined} className={`flex max-w-full items-center gap-2 rounded-lg border p-1.5 text-sm ${invalid ? "border-[var(--peligro)] bg-[var(--peligro-banda)] text-[var(--peligro-tx)]" : "border-[var(--borde)] bg-[var(--s2)]"}`}>
    <FilePreview file={file} /><span className="max-w-44 truncate">{file.name}</span><FileSizeText value={file.size} />
    <AttachmentPrimitive.Remove asChild><button type="button" disabled={pending} aria-label={t("attachments.remove", { name: file.name })}><CloseIcon className="size-5" /></button></AttachmentPrimitive.Remove>
  </li></AttachmentPrimitive.Root>;
}

export function AttachmentComposer({ files, limits, errorId, placeholder, unavailable, pending, canStop, onFiles, onStop }: {
  limits: AssistantAttachmentLimits;
  placeholder: string;
  errorId?: string;
  files: readonly PendingAssistantFile[]; unavailable: boolean; pending: boolean; canStop: boolean;
  onFiles: (files: File[]) => void; onStop: () => void;
}) {
  const { t } = useTranslation(["assistant", "common"]);
  const format = useFormat();
  const text = useAuiState((state) => state.composer.text);
  const running = useAuiState((state) => state.thread.isRunning);
  const [required, setRequired] = useState(false);
  const invalid = files.some((item) => item.invalid);
  const fileInput = useRef<HTMLInputElement>(null);
  return <ComposerPrimitive.Root onSubmit={(event) => { if (!text.trim() || invalid) { event.preventDefault(); if (!text.trim()) setRequired(true); } }}
    className="flex flex-col gap-2 rounded-2xl border border-[var(--borde2)] bg-[var(--lado-activo)] p-3 focus-within:border-[var(--marca)]">
    <FilesContext.Provider value={{ files, errorId, pending }}><ul className="flex flex-wrap gap-2"><ComposerPrimitive.Attachments components={{ Attachment: ComposerFile }} /></ul></FilesContext.Provider>
    <div className="[&_label]:sr-only"><FormField label={t("composer.label")} error={required ? t("composer.required") : undefined}>
      <ComposerPrimitive.Input asChild addAttachmentOnPaste={false} onChange={() => setRequired(false)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && (!text.trim() || invalid)) { event.preventDefault(); if (!text.trim()) setRequired(true); } }}>
        <Textarea placeholder={placeholder} disabled={unavailable || pending} className="min-h-16 resize-none border-0 shadow-none" />
      </ComposerPrimitive.Input>
    </FormField></div>
    <div className="flex items-center gap-2">
      <input ref={fileInput} type="file" multiple tabIndex={-1} accept={assistantAttachmentTypes.join(",")} aria-label={t("attachments.add")} aria-invalid={files.some((item) => item.invalid) || undefined} aria-describedby={errorId} className="sr-only" disabled={unavailable || pending}
        onChange={(event) => { onFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <Button type="button" variant="icon" size="icon" aria-label={t("attachments.add")} title={t("attachments.hint", { count: limits.maxAttachments, maxFiles: format.formatInteger(limits.maxAttachments), size: format.formatFileSize(limits.maxAttachmentBytes) })} disabled={unavailable || pending} onClick={() => fileInput.current?.click()}><Paperclip className="size-5" /></Button>
      <span className="flex-1" />
      {canStop ? running ? <ComposerPrimitive.Cancel asChild><Button type="button" variant="outline">{t("composer.stop")}</Button></ComposerPrimitive.Cancel>
        // Antes de start todavía no hay un turno SDK. El servidor conserva la
        // detención diferida sin inventar un mensaje/turno para habilitar Cancel.
        : <Button type="button" variant="outline" onClick={onStop}>{t("composer.stop")}</Button>
        : <ComposerPrimitive.Send asChild><Button type="button" disabled={unavailable} pending={pending} aria-label={pending ? t("common:states.saving") : t("composer.send")}
          onClick={(event) => { if (!text.trim() || invalid) { event.preventDefault(); if (!text.trim()) setRequired(true); } }}><SendIcon className="size-4" /></Button></ComposerPrimitive.Send>}
    </div>
  </ComposerPrimitive.Root>;
}
