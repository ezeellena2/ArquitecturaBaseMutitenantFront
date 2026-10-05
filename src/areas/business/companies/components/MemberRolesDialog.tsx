import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { CompanyMemberResponse, RoleResponse, UpdateCompanyMemberRolesRequest } from "@/shared/api/types";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { orderLike } from "@/shared/lib/orderLike";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { companiesQueryRoot, updateCompanyMemberRoles } from "../api/companies";
import { memberErrorField } from "../errors";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";

/// Sin reglas propias: los roles son opcionales («Sin roles»), pero va con React Hook Form y zod como todo formulario.
const memberRolesFormSchema = z.object({ roleIds: z.array(z.string()) });

type MemberRolesForm = z.infer<typeof memberRolesFormSchema>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof MemberRolesForm> = { roleIds: "roleIds" };

/**
 * «Roles de …» (tablero Empresa, v100): el diálogo chico, sin bajada debajo del título («Criterio · Diálogos»). Con React
 * Hook Form y zod, como Roles: es dueño de los roles elegidos, del guardado con la versión de la membresía y de su error.
 * «Guardar cambios» se apaga sin cambios («Criterio · Botones»): sacar un rol y volver a ponerlo no cuenta (`orderLike`).
 * Se monta solo mientras está abierto y, al cerrar, le devuelve el foco al ⋮ de la fila (`returnFocusTo`), porque la
 * opción se fue con el menú.
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
  const form = useForm<MemberRolesForm>({ resolver: zodResolver(memberRolesFormSchema), defaultValues: { roleIds: member.roles.map((role) => role.id) } });
  const roleIds = useController({ control: form.control, name: "roleIds" });
  const { failure, clear, fail, close } = useDialogFailure(onClose, companiesQueryRoot);
  const save = useMutation({ mutationFn: (request: UpdateCompanyMemberRolesRequest) => updateCompanyMemberRoles(companyId, member.memberId, request) });

  // Un rol que el back no acepta va debajo de los roles (`errors.ts`); lo demás, también el 409 y el último administrador
  // (tablero Empresa, v97), en la franja arriba de los botones.
  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    if (memberErrorField(error) === "roleIds" && error instanceof ApiError) form.setError("roleIds", { type: "server", message: error.detail ?? "" });
    else fail(error);
  }

  // Lo que sigue al guardado va en sus callbacks: «Reintentar» (sin conexión) los vuelve a correr.
  const submit = form.handleSubmit((values) => {
    save.mutate({ roleIds: values.roleIds, version: member.version }, {
      onSuccess: async () => {
        toast.success(t("companies:messages.rolesUpdated", { name: member.displayName }));
        onClose();
        await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
      },
      onError: rejected,
    });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("companies:editMemberRoles.title", { name: member.displayName })}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("companies:editMemberRoles.roles")} error={form.formState.errors.roleIds?.message}>
            <MultiSelect options={roles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} value={roleIds.field.value}
              onChange={(next) => { roleIds.field.onChange(orderLike(form.formState.defaultValues?.roleIds, next)); clear(); }} placeholder={t("companies:addMember.noRoles")} />
          </FormField>
          {/* Tablero Empresa (v97): el error, una sola vez, en la franja con su ícono arriba de los botones. */}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={!form.formState.isDirty} pending={save.isPending}>{t("companies:editMemberRoles.save")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
