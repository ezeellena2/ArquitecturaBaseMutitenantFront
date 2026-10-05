import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { AddCompanyMemberRequest, RoleResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { addCompanyMember, companiesQueryRoot, companyCandidatesQueryKey, fetchCompanyCandidates } from "../api/companies";
import { memberErrorField } from "../errors";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";

/// Lo que se valida antes de mandar: la persona es obligatoria; sus roles en la empresa, no.
function addMemberFormSchema(t: TFunction) {
  return z.object({ memberId: z.string().min(1, t("companies:addMember.userRequired")), roleIds: z.array(z.string()) });
}

type AddMemberForm = z.infer<ReturnType<typeof addMemberFormSchema>>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof AddMemberForm> = { memberId: "memberId", roleIds: "roleIds" };

/**
 * «Agregar miembro» (tablero Empresa, v100): el diálogo chico, sin bajada debajo del título («Criterio · Diálogos»); la
 * empresa ya se ve atrás. Las personas salen de los candidatos de la empresa (decisión 96, v108): las activas de la
 * organización que todavía no están en ella, con el nombre y, debajo, el correo tapado. Las pide quien administra la
 * empresa sin `users.read`, y también la Dueña: una sola forma. Con React Hook Form y zod, como Roles: es dueño de lo elegido, del alta y de su error, que se va
 * al cambiar la persona o sus roles, como en los otros diálogos de Empresa. Se monta solo mientras está abierto y, al
 * cerrar, le devuelve el foco al botón que lo abrió.
 */
export function AddMemberDialog({ companyId, roles, onClose }: {
  companyId: string;
  /** Los roles que se asignan en esta empresa: los de cada empresa y los propios. */
  roles: readonly RoleResponse[];
  onClose: () => void;
}) {
  const { t } = useTranslation(["companies", "common"]);
  const queryClient = useQueryClient();
  const restoreFocus = useRestoreFocusOnClose();
  const schema = useMemo(() => addMemberFormSchema(t), [t]);
  const form = useForm<AddMemberForm>({ resolver: zodResolver(schema), defaultValues: { memberId: "", roleIds: [] } });
  const member = useController({ control: form.control, name: "memberId" });
  const roleIds = useController({ control: form.control, name: "roleIds" });
  const { failure, clear, fail, close } = useDialogFailure(onClose, companiesQueryRoot);
  const candidateQuery = useQuery({ queryKey: companyCandidatesQueryKey(companyId), queryFn: () => fetchCompanyCandidates(companyId), meta: { silent: true } });
  const candidates = candidateQuery.data?.items ?? [];
  const addMember = useIdempotentMutation((request: AddCompanyMemberRequest, key) => addCompanyMember(companyId, request, key));
  const loading = candidateQuery.isPending;

  // Lo que el back rechaza de la persona o de los roles va debajo de ese campo (`errors.ts`); lo demás, en la franja.
  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    const field = memberErrorField(error);
    if (field && error instanceof ApiError) form.setError(field, { type: "server", message: error.detail ?? "" });
    else fail(error);
  }

  // «Criterio · Botones»: «Agregar miembro» no se apaga; sin usuario, el campo dice qué falta (tablero Empresa) hasta que
  // elige uno. Lo que sigue al alta va en sus callbacks: «Reintentar» (sin conexión) los vuelve a correr.
  const submit = form.handleSubmit((values) => {
    const name = candidates.find((candidate) => candidate.memberId === values.memberId)?.displayName ?? "";
    addMember.mutate({ memberId: values.memberId, roleIds: values.roleIds }, {
      onSuccess: async () => {
        toast.success(t("companies:messages.memberAdded", { name }));
        onClose();
        await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
      },
      onError: rejected,
    });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("companies:addMember.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("companies:addMember.user")} required error={form.formState.errors.memberId?.message}>
            <Select value={member.field.value} onValueChange={(memberId) => { member.field.onChange(memberId); clear(); }} disabled={loading || candidates.length === 0}>
              <SelectTrigger className="w-full" aria-label={t("companies:addMember.user")}><SelectValue placeholder={loading ? t("common:states.loading") : t("companies:addMember.chooseUser")} /></SelectTrigger>
              {/* Tablero Empresa: cada candidato con su nombre y, debajo, el correo tapado en gris medio (.op2 .opd); sin
                  nombre, el nombre ya es el correo tapado y no se repite. */}
              <SelectContent>{candidates.map((candidate) => <SelectItem key={candidate.memberId} value={candidate.memberId} descriptionClassName="text-[var(--t2)]"
                description={candidate.maskedEmailAddress === candidate.displayName ? undefined : candidate.maskedEmailAddress ?? t("companies:addMember.withoutEmail")}>
                {candidate.displayName}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label={t("companies:addMember.roles")} error={form.formState.errors.roleIds?.message}>
            <MultiSelect options={roles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} value={roleIds.field.value} onChange={(next) => { roleIds.field.onChange(next); clear(); }} placeholder={t("companies:addMember.noRoles")} />
          </FormField>
          {/* «Criterio · Diálogos»: el error general, también el 409, en la franja arriba de los botones. */}
          {candidateQuery.isError ? <FormError message={apiErrorMessage(candidateQuery.error, t)} /> : null}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" pending={addMember.isPending} pendingLabel={t("companies:actions.addingMember")}>{t("companies:actions.addMember")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
