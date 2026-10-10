import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { FileSizeText } from "@/shared/ui/format/FileSizeText";
import { FormField } from "@/shared/ui/FormField";
import { CloseIcon, SendIcon } from "@/shared/ui/icons";
import { FileText, Paperclip } from "lucide-react";

import { assistantAttachmentTypes, type PendingAssistantFile } from "../lib/assistantFiles";

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

export function AttachmentComposer({ files, errorId, placeholder, disabled, pending, canStop, onFiles, onRemove, onSend, onStop }: {
  placeholder: string;
  errorId?: string;
  files: readonly PendingAssistantFile[]; disabled: boolean; pending: boolean; canStop: boolean;
  onFiles: (files: File[]) => void; onRemove: (id: string) => void; onSend: (text: string) => Promise<boolean>; onStop: () => void;
}) {
  const { t } = useTranslation("assistant");
  const schema = z.object({ text: z.string().trim().min(1, t("composer.required")) });
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { text: "" } });
  const fileInput = useRef<HTMLInputElement>(null);
  return <form onSubmit={form.handleSubmit(async ({ text }) => { if (await onSend(text)) form.reset(); })}
    className="flex flex-col gap-2 rounded-2xl border border-[var(--borde2)] bg-[var(--lado-activo)] p-3 focus-within:border-[var(--marca)]">
    {files.length ? <ul className="flex flex-wrap gap-2">{files.map(({ id, file, invalid }) => <li key={id} aria-describedby={invalid && errorId ? `${errorId}-${id}` : undefined} className={`flex max-w-full items-center gap-2 rounded-lg border p-1.5 text-sm ${invalid ? "border-[var(--peligro)] bg-[var(--peligro-banda)] text-[var(--peligro-tx)]" : "border-[var(--borde)] bg-[var(--s2)]"}`}>
      <FilePreview file={file} /><span className="max-w-44 truncate">{file.name}</span><FileSizeText value={file.size} />
      <button type="button" disabled={pending} aria-label={t("attachments.remove", { name: file.name })} onClick={() => onRemove(id)}><CloseIcon className="size-5" /></button>
    </li>)}</ul> : null}
    <div className="[&_label]:sr-only"><FormField label={t("composer.label")} error={form.formState.errors.text?.message}><Textarea {...form.register("text")} placeholder={placeholder} disabled={disabled || pending} className="min-h-16 resize-none border-0 shadow-none" /></FormField></div>
    <div className="flex items-center gap-2">
      <input ref={fileInput} type="file" multiple accept={assistantAttachmentTypes.join(",")} aria-label={t("attachments.add")} aria-invalid={files.some((item) => item.invalid) || undefined} aria-describedby={errorId} className="sr-only" disabled={disabled || pending}
        onChange={(event) => { onFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <Button type="button" variant="icon" size="icon" aria-label={t("attachments.add")} disabled={disabled || pending} onClick={() => fileInput.current?.click()}><Paperclip className="size-5" /></Button>
      <span className="flex-1" />
      {canStop ? <Button type="button" variant="outline" onClick={onStop}>{t("composer.stop")}</Button> : <Button type="submit" disabled={disabled || pending} aria-label={t("composer.send")}><SendIcon className="size-4" /></Button>}
    </div>
  </form>;
}
