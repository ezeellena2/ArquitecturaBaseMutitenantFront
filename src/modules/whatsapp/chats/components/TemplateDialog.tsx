import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { EnumText } from "@/shared/ui/format/EnumText";
import { MoneyText } from "@/shared/ui/format/MoneyText";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { SearchSelect } from "@/shared/ui/SearchSelect";
import type { SendWhatsAppTemplateRequest, WhatsAppChatMessageResponse, WhatsAppConversationRowResponse } from "../../api/types";
import { chatsScopeQueryRoot, sendTemplate, templateOptions, type ChatsScope } from "../api/chats";
import { asMoney } from "../../lib/values";
import { templatePreview } from "../lib/conversation";

interface TemplateForm { templateId: string; variables: string[] }

/** Lo que el back rechaza de la plantilla va debajo de ella; lo demás, en la franja. */
const serverFields = { templateId: "templateId" } as const;
const takenOrClosed = ["WhatsApp.Conversation.TakenByOther", "WhatsApp.Conversation.ReadOnly"];

/// «Elegir plantilla» (WA-Chats-Plantilla y M-WA-Chats-Plantilla): la plantilla con su categoría, un campo por cada
/// variable, la vista previa del cuerpo (CC03) con lo escrito en negrita y el costo estimado que calcula el back. El
/// front nunca calcula dinero: muestra `estimatedCost` con `MoneyText`. Se monta solo abierto.
export function TemplateDialog({ scope, row, name, onClose, onSent, onConflict }: {
  scope: ChatsScope;
  row: WhatsAppConversationRowResponse;
  name: string;
  onClose: () => void;
  onSent: (message: WhatsAppChatMessageResponse) => void;
  /** Otra persona lo tomó o se desconectó el número: el chat lo dice y el diálogo se cierra. */
  onConflict: (error: ApiError) => void;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose();
  const required = t("chats.template.required");
  const schema = useMemo(() => z.object({ templateId: z.string().min(1, required), variables: z.array(z.string().trim().min(1, required)) }), [required]);
  const form = useForm<TemplateForm>({ resolver: zodResolver(schema), defaultValues: { templateId: "", variables: [] } });
  const template = useController({ control: form.control, name: "templateId" });
  const values = useWatch({ control: form.control, name: "variables" });
  const options = useResourceOptions(templateOptions(scope, row.id));
  const selected = options.knownItems.find((option) => option.templateId === template.field.value);
  const { failure, clear, fail, close } = useDialogFailure(onClose, chatsScopeQueryRoot(scope));
  const send = useIdempotentMutation((request: SendWhatsAppTemplateRequest, key) => sendTemplate(scope, row.id, request, key));

  function rejected(error: unknown) {
    if (error instanceof ApiError && takenOrClosed.includes(error.code ?? "")) { onConflict(error); onClose(); return; }
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    if (error instanceof ApiError && error.code === "WhatsApp.Template.NotApproved") form.setError("templateId", { type: "server", message: error.detail ?? "" });
    else fail(error);
  }

  const submit = form.handleSubmit((value) => {
    send.mutate({ templateId: value.templateId, variables: value.variables.map((variable) => variable.trim()) }, {
      onSuccess: (message) => { onSent(message); onClose(); },
      onError: rejected,
    });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{phone ? t("chats.template.titleShort") : t("chats.template.title", { name })}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody className="md:grid md:grid-cols-2 md:gap-3.5">
          <div className="md:col-span-2">
            <FormField label={t("chats.template.template")} required error={form.formState.errors.templateId?.message}>
              <SearchSelect value={template.field.value} remote={options.remote} placeholder={t("chats.template.choose")} searchLabel={t("chats.template.search")}
                aria-label={t("chats.template.template")} title={t("chats.template.template")}
                onChange={(templateId) => {
                  const next = options.knownItems.find((option) => option.templateId === templateId);
                  template.field.onChange(templateId);
                  form.setValue("variables", next ? next.variables.map(() => "") : []);
                  form.clearErrors("variables");
                  clear();
                }}
                selectedLabel={selected?.name}
                renderValue={(option) => <>{option.label}{" · "}<EnumText enum="WhatsAppTemplateCategory" value={options.knownItems.find((item) => item.templateId === option.value)?.category} /></>}
                options={options.items.map((option) => ({ value: option.templateId, label: option.name,
                  description: format.isLoading ? undefined : format.formatEnum("WhatsAppTemplateCategory", option.category) }))} />
            </FormField>
          </div>
          {selected?.variables.map((label, index) => <FormField key={`${selected.templateId}-${index}`} label={label} required error={form.formState.errors.variables?.[index]?.message}>
            <Input {...form.register(`variables.${index}`, { onChange: clear })} />
          </FormField>)}
          {selected ? <>
            <p aria-label={t("chats.template.preview")} className="max-w-[90%] justify-self-end rounded-[12px] rounded-tr-[4px] bg-[var(--marca-t)] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[var(--sugerencia-tx)] whitespace-pre-wrap max-md:self-end max-md:text-[15px] md:col-span-2">
              {templatePreview(selected.body, values).map((part, index) => part.kind === "variable" ? <b key={index} className="font-bold">{part.text}</b> : <span key={index}>{part.text}</span>)}
            </p>
            <p className="-mt-1.5 text-right text-[12.5px] text-[var(--t3)] max-md:text-[13.5px] md:col-span-2">
              {t("chats.template.estimatedCost")}{" "}{asMoney(selected.estimatedCost) ? <MoneyText value={asMoney(selected.estimatedCost)} /> : <EmptyValue />}
            </p>
          </> : null}
          <div className="md:col-span-2 empty:hidden"><FormError message={actionErrorMessage(failure, t)} /></div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" pending={send.isPending} pendingLabel={t("chats.template.sending")}>{t("chats.template.send")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
