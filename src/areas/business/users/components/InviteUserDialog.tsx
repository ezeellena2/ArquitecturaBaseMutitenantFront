import { zodResolver } from "@hookform/resolvers/zod";
import { useQueries } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { CompanyResponse, InviteOrganizationUserRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { fetchAssignableRoles, inviteUser, userRolesQueryKey } from "../api/users";

// «Ninguna» en el desplegable de Empresa del tablero Usuarios (Invitar).
const noCompany = "none";

/// Lo que se valida antes de mandar: el correo, sin espacios de más; lo demás es opcional.
function inviteFormSchema(t: TFunction) {
  return z.object({
    email: z.string().trim().pipe(z.email(t("auth:login.emailInvalid"))),
    roleIds: z.array(z.string()),
    companyId: z.string(),
    companyRoleIds: z.array(z.string()),
  });
}

type InviteForm = z.input<ReturnType<typeof inviteFormSchema>>;
type InviteValues = z.output<ReturnType<typeof inviteFormSchema>>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof InviteForm> = { email: "email", roleIds: "roleIds" };

/// «Invitar usuario» (tableros Usuarios-Invitar y M-Usuarios-Invitar): todo es opcional salvo el correo, y se invita a
/// una sola empresa con sus roles (decisión 4 del usuario; desde la ficha se suman más). Se monta solo mientras está
/// abierto: lo escrito, el error y la clave del alta se van al cerrarlo. «Invitar» no se apaga («Criterio · Botones»).
export function InviteUserDialog({ companies, onClose, onInvited }: {
  /** Las empresas activas, a las que se puede invitar. */
  companies: readonly CompanyResponse[];
  onClose: () => void;
  /** Después de invitar: la pantalla vuelve a leer la lista. */
  onInvited: () => Promise<unknown>;
}) {
  const { t } = useTranslation(["users", "auth", "common"]);
  const format = useFormat();
  const restoreFocus = useRestoreFocusOnClose();
  const schema = useMemo(() => inviteFormSchema(t), [t]);
  const form = useForm<InviteForm, unknown, InviteValues>({ resolver: zodResolver(schema), defaultValues: { email: "", roleIds: [], companyId: "", companyRoleIds: [] } });
  const roleIds = useController({ control: form.control, name: "roleIds" });
  const company = useController({ control: form.control, name: "companyId" });
  const companyRoleIds = useController({ control: form.control, name: "companyRoleIds" });
  const roleQueries = useQueries({ queries: (["Organization", "Company"] as const).map((scope) => ({
    queryKey: userRolesQueryKey(scope), queryFn: () => fetchAssignableRoles(scope), meta: { silent: true },
  })) });
  const organizationRoles = roleQueries[0].data?.items ?? [];
  const companyRoles = (roleQueries[1].data?.items ?? []).filter((role) => role.scope === "AnyCompany" || role.companyId === company.field.value);
  const invite = useIdempotentMutation((request: InviteOrganizationUserRequest, key) => inviteUser(request, key));
  const [failure, setFailure] = useState<unknown>();

  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    setFailure(error);
  }

  // Los pasos que siguen al envío van en sus callbacks: «Reintentar» (sin conexión) los vuelve a correr.
  const submit = form.handleSubmit((values) => {
    setFailure(undefined);
    const request: InviteOrganizationUserRequest = {
      email: values.email,
      roleIds: values.roleIds,
      companies: values.companyId ? [{ companyId: values.companyId, roleIds: values.companyRoleIds }] : [],
    };
    invite.mutate(request, {
      onSuccess: async (issued) => {
        toast.success(t("users:messages.invited", { email: request.email, date: format.formatDate(issued.expiresAtUtc) }));
        onClose();
        await onInvited();
      },
      onError: rejected,
    });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    {/* Tablero M-Usuarios-Invitar: en el teléfono, una hoja de alto justo, abajo, con el cuerpo de los diálogos. */}
    <DialogContent onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("users:invite.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("users:invite.email")} required error={form.formState.errors.email?.message}>
            <Input autoComplete="email" type="email" maxLength={254} placeholder={t("users:invite.emailPlaceholder")} {...form.register("email")} />
          </FormField>
          <FormField label={t("users:invite.organizationRoles")}>
            <MultiSelect options={organizationRoles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} value={roleIds.field.value} onChange={roleIds.field.onChange} placeholder={t("users:invite.noRoles")} />
          </FormField>
          <div className="grid gap-3.5 md:grid-cols-2">
            <FormField label={t("users:invite.company")}>
              <Select value={company.field.value || noCompany} onValueChange={(value) => { company.field.onChange(value === noCompany ? "" : value); companyRoleIds.field.onChange([]); }}>
                <SelectTrigger className="w-full" aria-label={t("users:invite.company")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={noCompany}>{t("users:invite.noCompany")}</SelectItem>
                  {companies.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t("users:invite.companyRoles")}>
              {company.field.value
                ? <MultiSelect options={companyRoles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} value={companyRoleIds.field.value} onChange={companyRoleIds.field.onChange} placeholder={t("users:invite.noRoles")} />
                : <button type="button" disabled className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[var(--borde2)] bg-[var(--s2)] px-3 text-left text-[13px] text-[var(--t3)] max-md:h-12 max-md:rounded-[12px] max-md:text-[16px]">{t("users:invite.chooseCompanyFirst")}<ChevronDown aria-hidden="true" className="size-4 shrink-0" /></button>}
            </FormField>
          </div>
          {/* «Criterio · Diálogos»: el error general, en la franja arriba de los botones. */}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button type="submit" pending={invite.isPending} pendingLabel={t("users:invite.sending")}>{t("users:invite.send")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
