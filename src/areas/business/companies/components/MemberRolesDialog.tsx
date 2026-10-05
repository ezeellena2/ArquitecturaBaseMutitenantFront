import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import type { CompanyMemberResponse, RoleResponse } from "@/shared/api/types";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { companiesQueryRoot, updateCompanyMemberRoles } from "../api/companies";
import { useDialogFailure } from "./useDialogFailure";

/**
 * «Roles de …» (tablero Empresa, v100): el diálogo chico, sin bajada debajo del título («Criterio · Diálogos»). Es
 * dueño de los roles elegidos, del guardado con la versión de la membresía y de su error. Se monta solo mientras está
 * abierto y, al cerrar, le devuelve el foco al ⋮ de la fila (`returnFocusTo`), porque la opción se fue con el menú.
 */
export function MemberRolesDialog({ companyId, member, roles, onClose, returnFocusTo }: {
  companyId: string;
  member: CompanyMemberResponse;
  /** Los roles que se asignan en esta empresa: los de cada empresa y los propios. */
  roles: readonly RoleResponse[];
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["companies", "common"]);
  const queryClient = useQueryClient();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const [roleIds, setRoleIds] = useState(() => member.roles.map((role) => role.id));
  const { failure, clear, fail, close } = useDialogFailure(onClose);
  const save = useMutation({
    mutationFn: () => updateCompanyMemberRoles(companyId, member.memberId, { roleIds, version: member.version }),
    onSuccess: async () => {
      toast.success(t("companies:messages.rolesUpdated", { name: member.displayName }));
      onClose();
      await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
    },
    onError: fail,
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("companies:editMemberRoles.title", { name: member.displayName })}</DialogTitle></DialogHeader>
      <DialogBody>
        <FormField label={t("companies:editMemberRoles.roles")}>
          <MultiSelect options={roles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} value={roleIds}
            onChange={(next) => { setRoleIds(next); clear(); }} placeholder={t("companies:addMember.noRoles")} />
        </FormField>
        {/* Tablero Empresa (v97): el error, una sola vez, en la franja con su ícono arriba de los botones. */}
        <FormError message={actionErrorMessage(failure, t)} />
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
        <Button type="button" pending={save.isPending} onClick={() => save.mutate()}>{t("companies:editMemberRoles.save")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
