import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { RadioGroupField } from "@/shared/ui/RadioGroupField";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import type { WhatsAppConsent, WhatsAppContactResponse } from "../../api/types";
import { contactsQueryRoot, contactTagOptions, updateContact } from "../api/contacts";

const nameMaxLength = validationConstraints.UpdateWhatsAppContactHttpRequest.name.maxLength;
const tagsMaxItems = validationConstraints.UpdateWhatsAppContactHttpRequest.tags.maxItems;

/// Tableros WA-Contacto y M-WA-Contacto («Editar contacto»): lo que se elige a mano. «Se dio de baja» lo decide el
/// contacto con el botón de la difusión: si es lo guardado, se muestra apagado.
const editableConsents: readonly WhatsAppConsent[] = ["Accepted", "Declined", "NoAnswer"];

function contactFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("whatsapp:contacts.edit.nameRequired")).max(nameMaxLength),
    tags: z.array(z.string()).max(tagsMaxItems, t("whatsapp:contacts.edit.tooManyTags", { count: tagsMaxItems })),
    consent: z.enum(["Accepted", "Declined", "NoAnswer", "Unsubscribed"]),
  });
}

type ContactForm = z.input<ReturnType<typeof contactFormSchema>>;
type ContactFormValues = z.output<ReturnType<typeof contactFormSchema>>;

const serverFields: Record<string, keyof ContactForm> = { name: "name", tags: "tags", consent: "consent" };

const valuesFromContact = (contact: WhatsAppContactResponse): ContactForm => ({ name: contact.name ?? "", tags: [...contact.tags], consent: contact.consent });

/**
 * «Editar contacto» (tableros WA-Contacto y M-WA-Contacto): el nombre, el teléfono como texto, las etiquetas y si acepta
 * promociones. Guarda con la versión de cuando se abrió; un 409 queda en la franja y, al cerrar, se relee la ficha.
 */
export function EditContactDialog({ contact, onClose, returnFocusTo }: {
  contact: WhatsAppContactResponse;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const queryClient = useQueryClient();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const schema = useMemo(() => contactFormSchema(t), [t]);
  const { form, version } = useEditForm<WhatsAppContactResponse, ContactForm, ContactFormValues>({
    read: contact, toValues: valuesFromContact, resolver: zodResolver(schema),
  });
  const tags = useController({ control: form.control, name: "tags" });
  const consent = useController({ control: form.control, name: "consent" });
  const tagOptions = useResourceOptions(contactTagOptions);
  const { failure, clear, fail, close } = useDialogFailure(onClose, contactsQueryRoot);
  const update = useMutation({ mutationFn: (request: Parameters<typeof updateContact>[1]) => updateContact(contact.id, request) });
  const { errors } = form.formState;

  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    fail(error);
  }

  const submit = form.handleSubmit((values) => {
    clear();
    // El consentimiento viaja solo si se cambió a mano: así el origen guardado (bot, importación) no se pisa.
    const request = { name: values.name, tags: values.tags, consent: values.consent === contact.consent ? null : values.consent, version };
    update.mutate(request, {
      onSuccess: async () => {
        toast.success(t("whatsapp:contacts.edit.saved"));
        onClose();
        await queryClient.invalidateQueries({ queryKey: contactsQueryRoot });
      },
      onError: rejected,
    });
  });

  const consentOptions = [...editableConsents, ...(contact.consent === "Unsubscribed" ? ["Unsubscribed" as const] : [])]
    .map((value) => ({ value, label: format.formatEnum("WhatsAppConsent", value), disabled: value === "Unsubscribed" }));
  const tagOption = (tag: string) => ({ value: tag, label: tag });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("whatsapp:contacts.edit.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody className="md:grid md:grid-cols-2 md:gap-x-5">
          <FormField label={t("whatsapp:contacts.edit.name")} required error={errors.name?.message}>
            <Input {...form.register("name", { onChange: clear })} maxLength={nameMaxLength} autoComplete="off" />
          </FormField>
          <ReadOnlyField label={t("whatsapp:contacts.edit.phone")}><PhoneText value={contact.displayNumber} /></ReadOnlyField>
          <div className="md:col-span-2">
            <FormField label={t("whatsapp:contacts.edit.tags")} error={errors.tags?.message}>
              <MultiSelect creatable remote={tagOptions.remote} options={tagOptions.items.map(tagOption)}
                selectedOptions={[...contact.tags, ...tagOptions.knownItems].map(tagOption)} value={tags.field.value}
                onChange={(next) => { tags.field.onChange(next); clear(); }} placeholder={t("whatsapp:contacts.edit.noTags")} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label={t("whatsapp:contacts.edit.consent")} error={errors.consent?.message}>
              <RadioGroupField variant="segmented" label={t("whatsapp:contacts.edit.consent")} options={consentOptions}
                value={consent.field.value} onValueChange={(next) => { consent.field.onChange(next); clear(); }} />
            </FormField>
          </div>
          <div className="md:col-span-2 empty:hidden"><FormError message={actionErrorMessage(failure, t)} /></div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={!form.formState.isDirty} pending={update.isPending}>{t(phone ? "whatsapp:contacts.edit.savePhone" : "whatsapp:contacts.edit.save")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
