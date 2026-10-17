import { validationConstraints } from "@/shared/api/generated/validation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AttachmentPrimitive, ComposerPrimitive, useAuiState } from "@assistant-ui/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { FileSizeText } from "@/shared/ui/format/FileSizeText";
import { FormField } from "@/shared/ui/FormField";
import { CloseIcon } from "@/shared/ui/icons";
import { ArrowUp, FileText, Paperclip, Square } from "lucide-react";
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

export function AttachmentComposer({ files, limits, errorId, placeholder, unavailable, sendBlocked = false, pending, canStop, onFiles, onStop }: {
  limits: AssistantAttachmentLimits;
  placeholder: string;
  errorId?: string;
  files: readonly PendingAssistantFile[]; unavailable: boolean; pending: boolean; canStop: boolean;
  /** Un límite de uso (E9, P2): mandar espera la cuenta del aviso; lo escrito queda y se puede seguir escribiendo. */
  sendBlocked?: boolean;
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
    className="relative flex shrink-0 flex-col gap-2 rounded-2xl border border-[var(--borde2)] bg-[var(--lado-activo)] p-3 focus-within:border-[var(--marca)] max-md:rounded-[28px] max-md:p-2">
    <FilesContext.Provider value={{ files, errorId, pending }}><ul className="flex flex-wrap gap-2 empty:hidden"><ComposerPrimitive.Attachments components={{ Attachment: ComposerFile }} /></ul></FilesContext.Provider>
    <div className="[&_label]:sr-only max-md:mx-9"><FormField label={t("composer.label")} error={required ? t("composer.required") : undefined}>
      <ComposerPrimitive.Input asChild addAttachmentOnPaste={false} onChange={() => setRequired(false)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && (!text.trim() || invalid)) { event.preventDefault(); if (!text.trim()) setRequired(true); } }}>
        <Textarea rows={1} maxLength={validationConstraints.SendAssistantMessageHttpRequest.text.maxLength} placeholder={placeholder} disabled={unavailable || pending} className="min-h-16 resize-none border-0 shadow-none max-md:min-h-9 max-md:max-h-28 max-md:px-0 max-md:py-2 max-md:leading-5" />
      </ComposerPrimitive.Input>
    </FormField></div>
    <div className="flex items-center gap-2 max-md:absolute max-md:inset-x-2 max-md:bottom-2 max-md:pointer-events-none max-md:[&_button]:pointer-events-auto">
      <input ref={fileInput} type="file" multiple tabIndex={-1} accept={assistantAttachmentTypes.join(",")} aria-label={t("attachments.add")} aria-invalid={files.some((item) => item.invalid) || undefined} aria-describedby={errorId} className="sr-only" disabled={unavailable || pending}
        onChange={(event) => { onFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <Button type="button" variant="icon" size="icon" aria-label={t("attachments.add")} title={t("attachments.hint", { count: limits.maxAttachments, maxFiles: format.formatInteger(limits.maxAttachments), size: format.formatFileSize(limits.maxAttachmentBytes) })} disabled={unavailable || pending} onClick={() => fileInput.current?.click()}><Paperclip className="size-5" /></Button>
      <span className="flex-1" />
      {canStop ? running ? <ComposerPrimitive.Cancel asChild><Button type="button" variant="outline" size="icon" aria-label={t("composer.stop")} className="rounded-full"><Square className="size-3.5" aria-hidden="true" /></Button></ComposerPrimitive.Cancel>
        // Antes de start todavía no hay un turno SDK. El servidor conserva la
        // detención diferida sin inventar un mensaje/turno para habilitar Cancel.
        : <Button type="button" variant="outline" size="icon" aria-label={t("composer.stop")} className="rounded-full" onClick={onStop}><Square className="size-3.5" aria-hidden="true" /></Button>
        : <ComposerPrimitive.Send asChild><Button type="button" size="icon" className="rounded-full" disabled={unavailable || sendBlocked} pending={pending} aria-label={pending ? t("common:states.saving") : t("composer.send")}
          onClick={(event) => { if (!text.trim() || invalid) { event.preventDefault(); if (!text.trim()) setRequired(true); } }}><ArrowUp className="size-4" /></Button></ComposerPrimitive.Send>}
    </div>
  </ComposerPrimitive.Root>;
}
