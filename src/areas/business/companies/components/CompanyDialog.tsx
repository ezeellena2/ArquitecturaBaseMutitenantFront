import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import type { CompanyResponse, CreateCompanyRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { companiesQueryRoot, createCompany, updateCompany } from "../api/companies";
import { CompanyFields, companyPayload, draftFromCompany, emptyCompanyDraft, useCompanyValidation, type CompanyDraft } from "./CompanyFields";
import { useDialogFailure } from "./useDialogFailure";

// «Delta S.A.» + «. Quedaste…» no repite el punto final del nombre.
const sentence = (text: string) => text.replace("..", ".");

/**
 * «Crear empresa» y «Editar empresa» (tableros Empresas y Empresa): el diálogo normal y, en el teléfono, la hoja desde
 * abajo. Es dueño de su borrador, de su guardado y de su error. Se monta solo mientras está abierto y, al cerrar, le
 * devuelve el foco a lo que lo abrió, o a `returnFocusTo` si lo abrió una opción de un menú ⋮.
 */
export function CompanyDialog({ company, inDetail = false, onClose, returnFocusTo }: {
  /** Sin empresa, la crea; con una, la edita con su versión. */
  company?: CompanyResponse;
  /** En la ficha, el aviso de guardado no repite el nombre, que ya está en la banda. */
  inDetail?: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["companies", "common"]);
  const queryClient = useQueryClient();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const [draft, setDraft] = useState<CompanyDraft>(() => company ? draftFromCompany(company) : emptyCompanyDraft);
  const validation = useCompanyValidation(draft);
  const { failure, clear, fail, close } = useDialogFailure(onClose);
  const saved = async (message: string) => {
    toast.success(message);
    onClose();
    await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
  };
  const create = useIdempotentMutation((request: CreateCompanyRequest, key) => createCompany(request, key));
  const update = useMutation({
    mutationFn: (current: CompanyResponse) => updateCompany(current.id, { ...companyPayload(draft), version: current.version }),
    onSuccess: () => saved(inDetail ? t("companies:messages.detailUpdated") : sentence(t("companies:messages.updated", { name: draft.name.trim() }))),
    onError: fail,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // «Criterio · Formularios»: el nombre y el CUIT se revisan al tocar el botón; lo que falta lo dice el campo.
    if (!validation.validate()) return;
    clear();
    if (company) update.mutate(company);
    else create.mutate(companyPayload(draft), {
      onSuccess: () => saved(sentence(t("companies:messages.created", { name: draft.name.trim() }))),
      onError: fail,
    });
  }

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t(company ? "companies:editTitle" : "companies:createTitle")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="flex min-h-0 flex-col">
        <DialogBody>
          <CompanyFields draft={draft} onChange={(next) => { setDraft(next); clear(); }} errors={validation.errors} />
          {/* «Criterio · Diálogos»: el error general, también el 409, en la franja arriba de los botones. */}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          {/* «Criterio · Botones»: no se apaga con el CUIT mal; el campo ya dice qué corregir y no se manda nada. */}
          <Button type="submit" pending={create.isPending || update.isPending}>{t(company ? "companies:form.save" : "companies:form.create")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
