import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/shared/ui/FormField";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import type { AssistantConversationSummaryResponse } from "@/modules/assistant/api/types";

export interface ConversationDialogState { kind: "rename" | "delete"; conversation: AssistantConversationSummaryResponse; trigger: HTMLButtonElement | null }
export function ConversationDialog({ value, pending, error, onClose, onConfirm }: {
  value: ConversationDialogState; pending: boolean; error: string | null; onClose: () => void; onConfirm: (title: string) => void;
}) {
  const { t } = useTranslation("assistant");
  const restore = useRestoreFocusOnClose(true, value.trigger);
  const rename = value.kind === "rename" ? value.conversation : null;
  const form = useForm({ resolver: zodResolver(z.object({ title: z.string().trim().min(1, t("history.nameRequired")) })), defaultValues: { title: value.conversation.title ?? "" } });
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}><DialogContent size="sm" showCloseButton={value.kind === "rename"} onCloseAutoFocus={restore}>
    <DialogHeader><DialogTitle>{value.kind === "rename" ? t("history.renameTitle") : t("history.deleteTitle", { title: value.conversation.title ?? t("history.untitled") })}</DialogTitle></DialogHeader>
    <form onSubmit={value.kind === "rename" ? form.handleSubmit(({ title }) => onConfirm(title)) : (event) => { event.preventDefault(); onConfirm(""); }}>
      <DialogBody>{value.kind === "rename" ? <FormField label={t("history.name")} required error={form.formState.errors.title?.message}><Input {...form.register("title")} /></FormField> : <DialogDescription>{t("history.deleteBody")}</DialogDescription>}
        {error ? <p role="alert" className="text-[var(--peligro)]">{error}</p> : null}
      </DialogBody>
      <DialogFooter className="max-md:flex-col-reverse max-md:[&_button]:flex-none"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>{t("cancel")}</Button>
        <Button type="submit" variant={value.kind === "delete" ? "destructive" : "default"} disabled={Boolean(rename) && !form.formState.isDirty} pending={pending} pendingLabel={t(value.kind === "delete" ? "history.deleting" : "common:states.saving")}>{t(value.kind === "delete" ? "history.delete" : "history.saveChanges")}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
