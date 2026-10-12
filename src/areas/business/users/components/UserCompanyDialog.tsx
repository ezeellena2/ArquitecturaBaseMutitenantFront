import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { CompanyResponse, RoleResponse } from "@/shared/api/types";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { orderLike } from "@/shared/lib/orderLike";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { SearchSelect } from "@/shared/ui/SearchSelect";
import { companyOptions, roleOptions } from "@/shared/api/resourceOptions";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import type { CompanyAssignment } from "../lib/access";
import { RolesField } from "./RolesField";

/// Lo que se valida antes de mandar: la empresa es obligatoria; sus roles, no.
function companyFormSchema(t: TFunction) {
  return z.object({ companyId: z.string().min(1, t("users:detail.companyRequired")), roleIds: z.array(z.string()) });
}

type CompanyForm = z.infer<ReturnType<typeof companyFormSchema>>;

/// «Sumar empresa» y «Cambiar roles» de la ficha de Usuario (tablero Usuario, v100 y v104; M-Usuario-Empresa en el
/// teléfono). Se monta solo mientras está abierto. «Sumar» no se apaga («Criterio · Botones»): sin empresa, el campo dice
/// qué falta. «Guardar» de «Cambiar roles» se apaga sin cambios: sacar un rol y volver a ponerlo no cuenta (`orderLike`).
/// «Roles en la empresa» aparece al elegir la empresa y es opcional. Guarda al momento, con el guardado de la
/// ficha; su error, también el 409, va arriba de sus botones y se va al cambiar algo.
export function UserCompanyDialog({ mode, assignment, companyName, companies, roles, assignedRoles = [], excludedCompanyIds = [], pending, error, returnFocusTo, onEdit, onSave, onClose }: {
  mode: "add" | "roles";
  assignment: CompanyAssignment;
  /** La empresa cuyos roles se cambian, para el título. */
  companyName: string;
  /** Las empresas que se pueden sumar. */
  companies: readonly Pick<CompanyResponse, "id" | "name" | "status">[];
  /** Los roles de empresa: los de cualquier empresa y los de una en particular. */
  roles: readonly RoleResponse[];
  /** Etiquetas de los roles ya asignados, aunque no estén en las páginas de opciones cargadas. */
  assignedRoles?: readonly Pick<RoleResponse, "id" | "name">[];
  excludedCompanyIds?: readonly string[];
  pending: boolean;
  error: string | null;
  /** El ⋮ que lo abrió: la opción se fue con el menú y el foco vuelve a él. */
  returnFocusTo?: HTMLElement | null;
  /** Algo cambió en el diálogo: el error del guardado anterior se va. */
  onEdit: () => void;
  onSave: (assignment: CompanyAssignment) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(["users", "common"]);
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const schema = useMemo(() => companyFormSchema(t), [t]);
  const form = useForm<CompanyForm>({ resolver: zodResolver(schema), defaultValues: assignment });
  const company = useController({ control: form.control, name: "companyId" });
  const roleIds = useController({ control: form.control, name: "roleIds" });
  const companyQuery = useResourceOptions(companyOptions, mode === "add");
  const roleQuery = useResourceOptions(roleOptions("Company", company.field.value), Boolean(company.field.value));
  const companyRoles = roleQuery.items.filter((role) => role.scope === "AnyCompany" || role.companyId === company.field.value);
  const knownRoles = [...new Map([...assignedRoles, ...roles, ...roleQuery.knownItems].map((role) => [role.id, role])).values()];
  const submit = form.handleSubmit((values) => onSave(values));

  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
    {/* «Criterio · Diálogos»: dos campos, el chico de 420 px. */}
    <DialogContent size="sm" onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{mode === "add" ? t("users:detail.addCompanyTitle") : t("users:detail.changeCompanyRolesTitle", { name: companyName })}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          {mode === "add" ? <FormField label={t("users:invite.company")} required error={form.formState.errors.companyId?.message}>
            <SearchSelect value={company.field.value} onChange={(companyId) => { company.field.onChange(companyId); form.clearErrors("companyId"); roleIds.field.onChange([]); onEdit(); }}
              remote={companyQuery.remote} selectedLabel={[...companies, ...companyQuery.knownItems].find((item) => item.id === company.field.value)?.name}
              placeholder={t("users:invite.chooseCompany")} searchLabel={t("common:actions.search")} aria-label={t("users:invite.company")}
              options={companyQuery.items.filter((item) => item.status === "Active" && !excludedCompanyIds.includes(item.id)).map((option) => ({ value: option.id, label: option.name }))} />
          </FormField> : null}
          {company.field.value ? <RolesField key={company.field.value} label={t("users:invite.companyRoles")} allLabel={t("users:detail.allRoles")}
            remote={roleQuery.remote} allCount={roleQuery.allCount} selectedOptions={knownRoles.map((role) => ({ value: role.id, label: role.name }))} allOptions={async () => (await roleQuery.allItems()).map((role) => ({ value: role.id, label: role.name }))}
            options={companyRoles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} value={roleIds.field.value}
            onChange={(next) => { roleIds.field.onChange(orderLike(form.formState.defaultValues?.roleIds, next)); onEdit(); }} placeholder={t("users:detail.noRoles")} /> : null}
          {/* «Criterio · Diálogos»: el error general, también el 409, en la franja arriba de los botones. */}
          {error ? <FormError message={error} /> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={mode === "roles" && !form.formState.isDirty} pending={pending}>
            {mode === "add" ? t("users:detail.addCompanyConfirm") : t("users:detail.saveCompanyRoles")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
