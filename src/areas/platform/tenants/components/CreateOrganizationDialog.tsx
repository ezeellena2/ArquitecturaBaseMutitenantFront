import { validationConstraints } from "@/shared/api/generated/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { CreatePlatformTenantRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { maskEmail } from "@/shared/format/personalData";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { CultureSelect } from "@/shared/ui/fields/CultureSelect";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { createTenant } from "../api/tenants";
import { tenantCreateErrorField } from "../errors";

function createFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("platformTenants:create.nameRequired")),
    firstCompanyName: z.string().trim().min(1, t("platformTenants:create.companyRequired")),
    ownerEmail: z.string().trim().toLowerCase().min(1, t("platformTenants:create.emailRequired")).pipe(z.email(t("platformTenants:create.emailInvalid"))),
    culture: z.string(), timeZoneId: z.string(),
  });
}
type CreateForm = z.input<ReturnType<typeof createFormSchema>>;
type CreateValues = z.output<ReturnType<typeof createFormSchema>>;
const serverFields: Record<string, keyof CreateForm> = { name: "name", firstCompanyName: "firstCompanyName", ownerEmail: "ownerEmail", culture: "culture", timeZoneId: "timeZoneId" };

/** Alta del tablero Organizaciones. La clave nace con el diálogo; corregir el cuerpo inicia otra operación. */
export function CreateOrganizationDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<unknown> }) {
  const { t } = useTranslation(["platformTenants", "common"]);
  const { data: operator } = useCurrentUser();
  const restoreFocus = useRestoreFocusOnClose();
  const schema = useMemo(() => createFormSchema(t), [t]);
  const form = useForm<CreateForm, unknown, CreateValues>({ resolver: zodResolver(schema), defaultValues: {
    name: "", firstCompanyName: "", ownerEmail: "", culture: operator?.culture ?? "", timeZoneId: operator?.timeZoneId ?? "",
  } });
  const { field: { name: emailName, ref: emailRef, value: emailValue, onBlur: emailBlur, onChange: emailChange } } = useController({ control: form.control, name: "ownerEmail" });
  const culture = useController({ control: form.control, name: "culture" });
  const zone = useController({ control: form.control, name: "timeZoneId" });
  const [failure, setFailure] = useState<unknown>();
  const create = useIdempotentMutation((request: CreatePlatformTenantRequest, key) => createTenant(request, key), {
    sameOperation: (previous, next) => previous.name === next.name && previous.firstCompanyName === next.firstCompanyName && previous.ownerEmail === next.ownerEmail && previous.culture === next.culture && previous.timeZoneId === next.timeZoneId,
  });
  function rejected(error: unknown) {
    if (error instanceof ApiError) {
      if (applyApiErrorToForm(error, form.setError, serverFields)) return;
      const field = tenantCreateErrorField(error);
      if (field && error.detail) { form.setError(field, { type: "server", message: error.detail }); return; }
    }
    setFailure(error);
  }
  const clearFailure = () => setFailure(undefined);
  const submit = form.handleSubmit((values) => {
    clearFailure();
    create.mutate(values, {
      onSuccess: async (created) => { toast.success(t("platformTenants:messages.created", { name: created.name, email: maskEmail(values.ownerEmail) })); onClose(); await onCreated(); },
      onError: rejected,
    });
  });
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("platformTenants:create.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <div className="grid gap-3.5 md:grid-cols-2">
            <FormField label={t("platformTenants:create.name")} required error={form.formState.errors.name?.message}>
              <Input autoComplete="organization" maxLength={validationConstraints.CreatePlatformTenantHttpRequest.name.maxLength} {...form.register("name", { onChange: clearFailure })} />
            </FormField>
            <FormField label={t("platformTenants:create.firstCompany")} required error={form.formState.errors.firstCompanyName?.message}>
              <Input autoComplete="organization" maxLength={validationConstraints.CreatePlatformTenantHttpRequest.firstCompanyName.maxLength} {...form.register("firstCompanyName", { onChange: clearFailure })} />
            </FormField>
          </div>
          <FormField label={t("platformTenants:create.email")} required error={form.formState.errors.ownerEmail?.message}>
            <EmailField name={emailName} ref={emailRef} value={emailValue} onBlur={emailBlur} maxLength={validationConstraints.CreatePlatformTenantHttpRequest.ownerEmail.maxLength} onChange={(value) => { emailChange(value ?? ""); clearFailure(); }} />
          </FormField>
          <div className="grid gap-3.5 md:grid-cols-2">
            <FormField label={t("platformTenants:create.zone")} error={form.formState.errors.timeZoneId?.message}>
              <TimeZoneSelect value={zone.field.value} onChange={(value) => { zone.field.onChange(value); clearFailure(); }} placeholder={t("platformTenants:create.zone")} />
            </FormField>
            <FormField label={t("platformTenants:create.culture")} error={form.formState.errors.culture?.message}>
              <CultureSelect value={culture.field.value} onChange={(value) => { culture.field.onChange(value); clearFailure(); }} placeholder={t("platformTenants:create.culture")} />
            </FormField>
          </div>
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button type="submit" pending={create.isPending} pendingLabel={t("platformTenants:create.pending")}>{t("platformTenants:create.submit")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
