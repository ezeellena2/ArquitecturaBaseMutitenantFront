import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { actionErrorMessage, apiErrorMessage } from "@/shared/api/errorMessage";
import type { AddCompanyMemberRequest, RoleResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { addCompanyMember, companiesQueryRoot, fetchCompanyMemberIds, fetchOrganizationMembers } from "../api/companies";
import { useDialogFailure } from "./useDialogFailure";

/**
 * «Agregar miembro» (tablero Empresa, v100): el diálogo chico, sin bajada debajo del título («Criterio · Diálogos»); la
 * empresa ya se ve atrás. Es dueño de lo elegido, del alta y de su error. Se monta solo mientras está abierto y, al
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
  const [selectedMemberId, setSelectedMemberId] = useState("");
  // Tocó «Agregar miembro» sin elegir a nadie: el campo queda en rojo hasta que elige (tablero Empresa).
  const [missingMember, setMissingMember] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const { failure, fail, close } = useDialogFailure(onClose);
  const existingMemberIds = useQuery({ queryKey: ["companies", companyId, "all-member-ids"], queryFn: () => fetchCompanyMemberIds(companyId), meta: { silent: true } });
  const alreadyAssigned = new Set(existingMemberIds.data ?? []);
  const candidateQuery = useQuery({ queryKey: ["organization-members", "company-candidates"], queryFn: fetchOrganizationMembers, meta: { silent: true } });
  const candidates = (candidateQuery.data?.items ?? []).filter((member) => !alreadyAssigned.has(member.memberId));
  const addMember = useIdempotentMutation((request: AddCompanyMemberRequest, key) => addCompanyMember(companyId, request, key));
  const loading = candidateQuery.isPending || existingMemberIds.isPending;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // «Criterio · Botones»: «Agregar miembro» no se apaga; sin usuario, el campo dice qué falta.
    if (!selectedMemberId) { setMissingMember(true); return; }
    const name = candidates.find((member) => member.memberId === selectedMemberId)?.displayName ?? "";
    addMember.mutate({ memberId: selectedMemberId, roleIds }, {
      onSuccess: async () => {
        toast.success(t("companies:messages.memberAdded", { name }));
        onClose();
        await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
      },
      onError: fail,
    });
  }

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("companies:addMember.title")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("companies:addMember.user")} required error={missingMember ? t("companies:addMember.userRequired") : undefined}>
            <Select value={selectedMemberId} onValueChange={(value) => { setSelectedMemberId(value); setMissingMember(false); }} disabled={loading || candidates.length === 0}>
              <SelectTrigger className="w-full" aria-label={t("companies:addMember.user")}><SelectValue placeholder={loading ? t("common:states.loading") : t("companies:addMember.chooseUser")} /></SelectTrigger>
              <SelectContent>{candidates.map((member) => <SelectItem key={member.memberId} value={member.memberId}>{member.displayName}{" · "}{member.email ?? t("companies:addMember.withoutEmail")}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label={t("companies:addMember.roles")}>
            <MultiSelect options={roles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} value={roleIds} onChange={setRoleIds} placeholder={t("companies:addMember.noRoles")} />
          </FormField>
          {/* «Criterio · Diálogos»: el error general, también el 409, en la franja arriba de los botones. */}
          {candidateQuery.isError ? <FormError message={apiErrorMessage(candidateQuery.error, t)} /> : null}
          {existingMemberIds.isError ? <FormError message={apiErrorMessage(existingMemberIds.error, t)} /> : null}
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
