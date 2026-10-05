import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import type { OrganizationDomainResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { registerOrganizationDomain } from "../api/settings";

/// Lo que se valida antes de mandar: el dominio es obligatorio y se manda sin espacios de más.
function domainFormSchema(t: TFunction) {
  return z.object({ domain: z.string().trim().min(1, t("settings:domains.domainRequired")) });
}

type DomainForm = z.input<ReturnType<typeof domainFormSchema>>;
type DomainValues = z.output<ReturnType<typeof domainFormSchema>>;

/// «Agregar dominio» (tableros Configuracion-Dominio y M-Configuracion-Dominio). Se monta solo mientras está abierto: lo
/// escrito, el error y la clave del alta se van al cerrarlo. «Siguiente» no se apaga («Criterio · Botones»): sin dominio,
/// el campo dice qué falta. Registrado el dominio, la pantalla abre «Verificar» con el TXT.
export function AddDomainDialog({ onClose, onAdded }: { onClose: () => void; onAdded: (domain: OrganizationDomainResponse) => void }) {
  const { t } = useTranslation(["settings", "common"]);
  const restoreFocus = useRestoreFocusOnClose();
  const schema = useMemo(() => domainFormSchema(t), [t]);
  const form = useForm<DomainForm, unknown, DomainValues>({ resolver: zodResolver(schema), defaultValues: { domain: "" } });
  const add = useIdempotentMutation((request: DomainValues, key) => registerOrganizationDomain(request, key));
  const submit = form.handleSubmit((values) => { add.mutate(values, { onSuccess: onAdded }); });

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent size="sm" onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("settings:domains.addTitle")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        {/* «Criterio · Diálogos»: el cuerpo común, y el error general en la franja arriba de los botones. */}
        <DialogBody>
          <FormField label={t("settings:domains.domain")} required error={form.formState.errors.domain?.message}>
            <Input autoComplete="off" {...form.register("domain")} />
          </FormField>
          <FormError message={actionErrorMessage(add.error, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button type="submit" pending={add.isPending}>{t("settings:domains.next")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
