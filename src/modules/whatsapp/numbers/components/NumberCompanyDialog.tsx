import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import type { UpdateWhatsAppNumberRequest, WhatsAppNumberResponse } from "../../api/types";
import { numbersQueryRoot, updateNumber } from "../api/numbers";
import { CompanySelect, wholeOrganization } from "./CompanySelect";

const companyFormSchema = z.object({ company: z.string().min(1) });
type CompanyForm = z.infer<typeof companyFormSchema>;

/// «A quién atiende +54 9 351 555-0200» (WA-Admin y M-WA-Admin, «Cambiar a quién atiende»): el diálogo chico con un solo
/// campo, con React Hook Form y zod como todo formulario. Guarda con la versión del número; un 409 queda en la franja y,
/// al cerrar, relee la lista (`useDialogFailure`). «Guardar cambios» se apaga sin cambios.
export function NumberCompanyDialog({ number, title, onClose, returnFocusTo }: {
  number: WhatsAppNumberResponse;
  title: string;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const queryClient = useQueryClient();
  const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const form = useForm<CompanyForm>({ resolver: zodResolver(companyFormSchema), defaultValues: { company: number.company?.id ?? wholeOrganization } });
  const company = useController({ control: form.control, name: "company" });
  const { failure, clear, fail, close } = useDialogFailure(onClose, numbersQueryRoot);
  const save = useMutation({ mutationFn: (request: UpdateWhatsAppNumberRequest) => updateNumber(number.id, request) });

  const submit = form.handleSubmit((values) => {
    save.mutate({ companyId: values.company === wholeOrganization ? null : values.company, version: number.version }, {
      onSuccess: async () => {
        toast.success(t("whatsapp:numbers.company.saved"));
        onClose();
        await queryClient.invalidateQueries({ queryKey: numbersQueryRoot });
      },
      onError: fail,
    });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("whatsapp:numbers.company.label")} required>
            <CompanySelect value={company.field.value} current={number.company} onChange={(value) => { company.field.onChange(value); clear(); }} />
          </FormField>
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={!form.formState.isDirty} pending={save.isPending}>{t(phone ? "common:actions.save" : "whatsapp:numbers.company.save")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
