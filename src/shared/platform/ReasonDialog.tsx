import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, type MutationMeta, type QueryKey } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { DateField } from "@/shared/ui/fields/DateField";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Textarea } from "@/shared/ui/textarea";

export interface ReasonDialogValues { reason: string; expiresOn?: string }

export interface ReasonDialogProps<TData> {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
  queryRoot: QueryKey;
  stateConflictCodes?: readonly string[];
  blockedReason?: ReactNode;
  meta?: MutationMeta;
  date?: { initialValue?: string | null };
  /** La ✕ en la hoja del teléfono, como las de operador de M-Cuenta-Plat; en la compu ninguna lleva ✕. */
  phoneCloseButton?: boolean;
  mutationFn: (values: ReasonDialogValues) => Promise<TData>;
  onSuccess: (data: TData, values: ReasonDialogValues) => void | Promise<void>;
}

function reasonFormSchema(t: TFunction, withDate: boolean) {
  return z.object({
    reason: z.string().trim().min(1, t("common:reasonDialog.reasonRequired")),
    expiresOn: z.string().nullable().refine((value) => !withDate || value !== null, t("common:reasonDialog.dateInvalid")),
  });
}

type ReasonForm = z.infer<ReturnType<typeof reasonFormSchema>>;
const serverFields: Record<string, keyof ReasonForm> = { reason: "reason", expiresOn: "expiresOn" };

/** Confirmación con motivo de Plataforma (§11). Se monta sólo abierta. El caller recibe la respuesta original antes
 * del cierre: la versión de esa respuesta es la base siguiente, aunque la relectura de fondo tenga otra. */
export function ReasonDialog<TData>({ title, description, confirmLabel, pendingLabel, destructive, onClose, returnFocusTo,
  queryRoot, stateConflictCodes, blockedReason, meta, date, phoneCloseButton = false, mutationFn, onSuccess }: ReasonDialogProps<TData>) {
  const { t } = useTranslation("common");
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const { failure, clear, fail, close } = useDialogFailure(onClose, queryRoot, stateConflictCodes);
  const form = useForm<ReasonForm>({
    resolver: zodResolver(reasonFormSchema(t, date !== undefined)),
    defaultValues: { reason: "", expiresOn: date?.initialValue ?? null },
  });
  const until = useController({ control: form.control, name: "expiresOn" });
  const blocked = Boolean(blockedReason);

  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    fail(error);
  }

  const action = useMutation({
    meta,
    mutationFn: (values: ReasonDialogValues) => mutationFn(values),
    // El reintento del aviso global ejecuta este mismo éxito, también para acciones de cuenta que responden void.
    onSuccess: async (data, values) => { await onSuccess(data, values); close(); },
    onError: rejected,
  });
  const submit = form.handleSubmit((values) => {
    if (blocked) return;
    clear();
    action.mutate({ reason: values.reason, ...(date && values.expiresOn ? { expiresOn: values.expiresOn } : {}) });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" showCloseButton={phoneCloseButton ? "phone" : false} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          {blocked ? <FormError message={blockedReason} /> : null}
          <DialogDescription>{description}</DialogDescription>
          {!blocked ? <>
            {date ? <FormField label={t("reasonDialog.until")} required error={form.formState.errors.expiresOn?.message}>
              <DateField required name={until.field.name} value={until.field.value} disabled={action.isPending}
                invalidMessage={form.formState.errors.expiresOn ? null : t("reasonDialog.dateInvalid")} onChange={(value) => {
                until.field.onChange(value); form.clearErrors("expiresOn"); clear();
              }} />
            </FormField> : null}
            <FormField label={t("reasonDialog.reason")} required error={form.formState.errors.reason?.message}>
              <Textarea {...form.register("reason", { onChange: clear })} disabled={action.isPending} />
            </FormField>
          </> : null}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("actions.cancel")}</Button>
          <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={blocked} pending={action.isPending} pendingLabel={pendingLabel}>{confirmLabel}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
