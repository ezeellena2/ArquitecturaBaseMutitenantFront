import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { CompanyResponse, CreateCompanyRequest, UpdateCompanyRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import type { TaxIdTypeReference } from "@/shared/referenceData/referenceData";
import { useCuitType } from "@/shared/referenceData/useCuitType";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { isValidTaxId } from "@/shared/ui/fields/TaxIdField";
import { FormError } from "@/shared/ui/FormError";
import { companiesQueryRoot, createCompany, updateCompany } from "../api/companies";
import { companyErrorField } from "../errors";
import { CompanyFields } from "./CompanyFields";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";

// «Delta S.A.» + «. Quedaste…» no repite el punto final del nombre.
const sentence = (text: string) => text.replace("..", ".");

/// Lo que se valida antes de mandar: el nombre que falta y el CUIT, que es opcional, con su tipo del catálogo.
/// «Criterio · Formularios»: se revisan al tocar el botón, no mientras se escribe; después del primer error, se corrigen
/// mientras escribís.
function companyFormSchema(t: TFunction, cuitType: TaxIdTypeReference | undefined) {
  return z.object({
    name: z.string().trim().min(1, t("companies:form.nameRequired")),
    taxNumber: z.string().refine((value) => value === "" || isValidTaxId(cuitType, value), t("companies:form.taxIdInvalid")),
    timeZoneId: z.string(),
  });
}

/// Lo que se escribe y lo que se manda (el nombre sin espacios de más).
type CompanyForm = z.input<ReturnType<typeof companyFormSchema>>;
type CompanyFormValues = z.output<ReturnType<typeof companyFormSchema>>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof CompanyForm> = { name: "name", taxIdNumber: "taxNumber", timeZoneId: "timeZoneId" };

/// Al editar, lo guardado; al crear, todo vacío.
function valuesFromCompany(company: CompanyResponse | undefined): CompanyForm {
  return company ? { name: company.name, taxNumber: company.taxId?.number ?? "", timeZoneId: company.timeZoneId }
    : { name: "", taxNumber: "", timeZoneId: "" };
}

/// Solo el número: el tipo de identificación sale del país de la organización (el back lo resuelve). Sin zona, la de la
/// organización.
function companyRequest(values: CompanyFormValues): CreateCompanyRequest {
  return { name: values.name, taxIdNumber: values.taxNumber || null, timeZoneId: values.timeZoneId || null };
}

/**
 * «Crear empresa» y «Editar empresa» (tableros Empresas y Empresa): el diálogo normal y, en el teléfono, la hoja desde
 * abajo, con React Hook Form y zod, como Roles. Es dueño de lo escrito, de su guardado y de su error. Se monta solo
 * mientras está abierto y, al cerrar, le devuelve el foco a lo que lo abrió, o a `returnFocusTo` si lo abrió una opción
 * de un menú ⋮. Al editar, `useEditForm` recuerda la empresa de cuando se abrió: la ficha le pasa su lectura viva y una
 * relectura de fondo no cambia la versión que manda el guardado (formularios.md).
 */
export function CompanyDialog({ company, inDetail = false, onClose, returnFocusTo }: {
  /** Sin empresa, la crea; con una, la edita con la versión de cuando se abrió el diálogo. */
  company?: CompanyResponse;
  /** En la ficha, el aviso de guardado no repite el nombre, que ya está en la banda. */
  inDetail?: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["companies", "common"]);
  const queryClient = useQueryClient();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const cuitType = useCuitType();
  const schema = useMemo(() => companyFormSchema(t, cuitType), [t, cuitType]);
  const { form, version } = useEditForm<CompanyResponse | undefined, CompanyForm, CompanyFormValues>({
    read: company, toValues: valuesFromCompany, resolver: zodResolver(schema),
  });
  const { failure, clear, fail, close } = useDialogFailure(onClose, companiesQueryRoot);
  const create = useIdempotentMutation((request: CreateCompanyRequest, key) => createCompany(request, key));
  const update = useMutation({ mutationFn: ({ id, request }: { id: string; request: UpdateCompanyRequest }) => updateCompany(id, request) });

  // Lo que el back rechaza de un dato va debajo de ese dato (`errors.ts`), también el CUIT repetido; lo demás, como el
  // 409, en la franja arriba de los botones.
  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    const field = companyErrorField(error);
    if (field && error instanceof ApiError) form.setError(field, { type: "server", message: error.detail ?? "" });
    else fail(error);
  }

  async function saved(message: string) {
    toast.success(message);
    onClose();
    await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
  }

  // «Criterio · Botones»: el botón no se apaga con el nombre o el CUIT mal; el campo dice qué corregir y no se manda nada.
  // Al editar, «Guardar cambios» se apaga sin cambios; «Crear empresa» nunca.
  // Lo que sigue al guardado va en sus callbacks: «Reintentar» (sin conexión) los vuelve a correr.
  const submit = form.handleSubmit((values) => {
    clear();
    const request = companyRequest(values);
    if (company) {
      update.mutate({ id: company.id, request: { ...request, version } }, {
        onSuccess: () => { void saved(inDetail ? t("companies:messages.detailUpdated") : sentence(t("companies:messages.updated", { name: request.name }))); },
        onError: rejected,
      });
    } else {
      create.mutate(request, { onSuccess: () => { void saved(sentence(t("companies:messages.created", { name: request.name }))); }, onError: rejected });
    }
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t(company ? "companies:editTitle" : "companies:createTitle")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <CompanyFields form={form} onEdit={clear} />
          {/* «Criterio · Diálogos»: el error general, también el 409, en la franja arriba de los botones. */}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={Boolean(company) && !form.formState.isDirty} pending={create.isPending || update.isPending}>
            {t(company ? "companies:form.save" : "companies:form.create")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
