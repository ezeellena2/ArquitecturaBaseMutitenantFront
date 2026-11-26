import { validationConstraints } from "@/shared/api/generated/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { rateLimitedActionMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { InviteOrganizationUserRequest, OrganizationInvitationIssuedResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { sameList } from "@/shared/lib/sameList";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import {
  AssistantProposalMark, assistantProposalAlreadySaved, useAssistantProposal, useAssistantProposalFieldReview, type AssistantProposalValues,
} from "@/shared/assistant-actions";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { Picker, type PickerOption } from "@/shared/ui/Picker";
import { inviteUser, usersQueryRoot } from "../api/users";
import { uniqueOptions } from "../lib/access";
import { companyOptions, roleOptions } from "@/shared/api/resourceOptions";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";

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

/** Repetir la invitación con lo mismo conserva la clave; cambiar cualquier dato es otra operación (R05). */
function sameInvitation(previous: InviteOrganizationUserRequest, next: InviteOrganizationUserRequest) {
  const earlier = previous.companies ?? []; const later = next.companies ?? [];
  return previous.email === next.email && sameList(previous.roleIds, next.roleIds) && earlier.length === later.length
    && earlier.every((company, index) => company.companyId === later[index]?.companyId && sameList(company.roleIds, later[index]?.roleIds));
}

/** Lo que propone el asistente (users.invite@1), con la forma del formulario y el nombre de cada opción, que la
 * propuesta trae leído del servidor: va en `selectedOptions`, aunque no esté en la página cargada de cada lista. */
interface InviteProposal {
  readonly values: InviteForm;
  readonly roles: readonly PickerOption[];
  readonly company?: PickerOption;
  readonly companyRoles: readonly PickerOption[];
}

const optionsOf = (list: AssistantProposalValues["lists"][string] | undefined): PickerOption[] =>
  (list ?? []).map((option) => ({ value: option.id, label: option.label }));

/** La propuesta en el formulario; sin empresa no entran sus roles, y entonces el diálogo no la abre. */
function toInviteProposal(values: AssistantProposalValues): InviteProposal | undefined {
  const email = values.fields.email?.value;
  const company = values.fields.company;
  const companyId = typeof company?.value === "string" ? company.value : "";
  const companyRoles = optionsOf(values.lists.companyRoles);
  if (companyRoles.length > 0 && !companyId) return undefined;
  const roles = optionsOf(values.lists.roles);
  return {
    values: { email: typeof email === "string" ? email : "", roleIds: roles.map((role) => role.value), companyId, companyRoleIds: companyRoles.map((role) => role.value) },
    roles,
    company: companyId ? { value: companyId, label: company?.label ?? "" } : undefined,
    companyRoles,
  };
}

/// «Invitar usuario» (tableros Usuarios-Invitar y M-Usuarios-Invitar): todo es opcional salvo el correo, y se invita a
/// una sola empresa con sus roles (decisión 4 del usuario; desde la ficha se suman más). Se monta solo mientras está
/// abierto: lo escrito, el error y la clave del alta se van al cerrarlo. «Invitar» no se apaga («Criterio · Botones»),
/// salvo mientras cuenta la espera de un 429, como Mi cuenta: el tope del correo (0063 §7) dice su texto en la franja y
/// «Reintentá en 22 h 53 min» en el botón, sin el aviso de abajo.
///
/// Con `?proposal=<id>` de una propuesta del asistente (Usuarios-Invitar-Propuesta y su M-; ADR 0068 §9) abre con lo
/// propuesto cargado y sin mandar: «Propuesta del asistente» junto al título, «Revisá» con su motivo en lo dudoso y,
/// antes de «Invitar», el aviso de que manda la invitación. Guarda con la clave de la propuesta; si otra pestaña ya la
/// guardó, dice «Ya se guardó» y lleva a Usuarios. Si un valor no entra, es el diálogo de siempre.
export function InviteUserDialog({ onClose, onInvited }: {
  onClose: () => void;
  /** Después de invitar: la pantalla vuelve a leer la lista. */
  onInvited: () => Promise<unknown>;
}) {
  const { t } = useTranslation(["users", "auth", "common"]);
  const format = useFormat();
  const restoreFocus = useRestoreFocusOnClose();
  const schema = useMemo(() => inviteFormSchema(t), [t]);
  const proposal = useAssistantProposal("users.invite@1", toInviteProposal);
  // Lo propuesto, como estaba al abrir: el diálogo de la propuesta se monta con ella ya leída (AssistantProposalDialog,
  // keyed por id), y si después otra pestaña la guarda se sigue viendo lo mismo.
  const [proposed] = useState(() => (proposal.status === "ready" ? proposal.formValues : undefined));
  const form = useForm<InviteForm, unknown, InviteValues>({ resolver: zodResolver(schema), defaultValues: proposed?.values ?? { email: "", roleIds: [], companyId: "", companyRoleIds: [] } });
  const review = useAssistantProposalFieldReview();
  // «Ya se guardó»: otra pestaña la guardó (la propuesta pasó a aplicada) o el intento lo dijo (409 de `attempts`).
  const [savedElsewhere, setSavedElsewhere] = useState(false);
  const roleIds = useController({ control: form.control, name: "roleIds" });
  const company = useController({ control: form.control, name: "companyId" });
  const companyRoleIds = useController({ control: form.control, name: "companyRoleIds" });
  const companies = useResourceOptions(companyOptions);
  const orgOptions = useResourceOptions(roleOptions("Organization"));
  const companyOptionsQuery = useResourceOptions(roleOptions("Company", company.field.value || undefined), Boolean(company.field.value));
  const organizationRoles = orgOptions.items;
  const companyRoles = companyOptionsQuery.items.filter((role) => role.scope === "AnyCompany" || role.companyId === company.field.value);
  const [failure, setFailure] = useState<unknown>();
  const limit = useRetryAfterCountdown();

  function rejected(error: unknown) {
    limit.startFromError(error);
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    setFailure(error);
  }

  // Si la respuesta se pierde, corregir la invitación es otra operación con otra clave y repetir lo mismo conserva la suya
  // (R05). El aviso y el cierre salen del intento original, también desde «Reintentar».
  const action = useResourceAction<InviteOrganizationUserRequest>({ onError: rejected });
  function invited(issued: OrganizationInvitationIssuedResponse, request: InviteOrganizationUserRequest) {
    toast.success(t("users:messages.invited", { email: request.email, date: format.formatDate(issued.expiresAtUtc) }));
    onClose();
    void onInvited();
  }
  const invite = useIdempotentMutation(action.guarded((request, key: string) => inviteUser(request, key), invited),
    { meta: { ...action.meta, handlesRateLimit: true }, sameOperation: sameInvitation });
  // Con la propuesta, la clave la da la propuesta (`attempts`) y, después del 2xx, la tarjeta pasa a aplicada.
  const send = proposal.status === "ready" ? proposal.send : undefined;
  const inviteProposed = useMutation({
    meta: { handlesRateLimit: true },
    mutationFn: ({ request, save }: { request: InviteOrganizationUserRequest; save: NonNullable<typeof send> }) =>
      save((key) => inviteUser(request, key)),
    onSuccess: (issued, { request }) => invited(issued, request),
    onError: (error) => { if (assistantProposalAlreadySaved(error)) setSavedElsewhere(true); else rejected(error); },
  });
  const pending = invite.isPending || inviteProposed.isPending;
  const alreadySaved = proposed !== undefined && !pending && !inviteProposed.isSuccess && (savedElsewhere || proposal.status === "applied");
  // «Revisá» solo en lo que sigue elegido de lo propuesto.
  const doubts = (field: string, chosen: readonly string[]) =>
    proposal.status === "ready" && !alreadySaved ? review(chosen.map((id) => proposal.doubtOf(field, id))) : undefined;
  const rolesReview = doubts("roles", roleIds.field.value);
  const companyReview = proposal.status === "ready" && !alreadySaved && company.field.value === proposed?.company?.value ? review([proposal.doubtOf("company")]) : undefined;
  const companyRolesReview = doubts("companyRoles", companyRoleIds.field.value);

  const submit = form.handleSubmit((values) => {
    setFailure(undefined);
    const request: InviteOrganizationUserRequest = {
      email: values.email,
      roleIds: values.roleIds,
      companies: values.companyId ? [{ companyId: values.companyId, roleIds: values.companyRoleIds }] : [],
    };
    if (send) inviteProposed.mutate({ request, save: send });
    else invite.mutate(request);
  });

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    {/* Tablero M-Usuarios-Invitar: en el teléfono, una hoja de alto justo, abajo, con el cuerpo de los diálogos. */}
    <DialogContent onCloseAutoFocus={restoreFocus}>
      {/* Usuarios-Invitar-Propuesta (.acc-dh): «Propuesta del asistente» junto al título. */}
      <DialogHeader>{proposed
        ? <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><DialogTitle>{t("users:invite.title")}</DialogTitle><AssistantProposalMark /></div>
        : <DialogTitle>{t("users:invite.title")}</DialogTitle>}</DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          {alreadySaved ? <Banner tone="success">{t("common:assistantProposal.alreadySaved")}</Banner> : null}
          <FormField label={t("users:invite.email")} required error={form.formState.errors.email?.message}>
            <Input autoComplete="email" type="email" maxLength={validationConstraints.InviteOrganizationUserHttpRequest.email.maxLength} placeholder={t("users:invite.emailPlaceholder")} {...form.register("email")} />
          </FormField>
          <FormField label={t("users:invite.organizationRoles")} warning={rolesReview?.warning}>
            <Picker multiple adornment={rolesReview?.adornment} className={rolesReview?.className} remote={orgOptions.remote}
              selectedOptions={uniqueOptions(proposed?.roles, orgOptions.knownItems.map((role) => ({ value: role.id, label: role.name })))} options={organizationRoles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined, disabledReason: role.grantable === false ? t("common:roleChoice.notGrantable") : undefined }))} value={roleIds.field.value} onChange={roleIds.field.onChange} placeholder={t("users:invite.noRoles")} />
          </FormField>
          <div className="grid gap-3.5 md:grid-cols-2">
            <FormField label={t("users:invite.company")} warning={companyReview?.warning}>
              <Picker adornment={companyReview?.adornment} className={companyReview?.className} value={company.field.value || noCompany} onChange={(value) => {
                const next = value === noCompany ? "" : value;
                if (next === company.field.value) return;
                company.field.onChange(next);
                companyRoleIds.field.onChange([]);
              }} remote={companies.remote} first={{ value: noCompany, label: t("users:invite.noCompany") }}
                selectedOptions={uniqueOptions(proposed?.company ? [proposed.company] : [], companies.knownItems.map((item) => ({ value: item.id, label: item.name })))
                  .filter((item) => item.value === company.field.value)}
                options={companies.items.filter((item) => item.status === "Active").map((option) => ({ value: option.id, label: option.name }))} />
            </FormField>
            <FormField label={t("users:invite.companyRoles")} warning={company.field.value ? companyRolesReview?.warning : undefined}>
              {company.field.value
                ? <Picker multiple adornment={companyRolesReview?.adornment} className={companyRolesReview?.className} remote={companyOptionsQuery.remote}
                  selectedOptions={uniqueOptions(company.field.value === proposed?.company?.value ? proposed.companyRoles : [], companyOptionsQuery.knownItems.map((role) => ({ value: role.id, label: role.name })))} options={companyRoles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined, disabledReason: role.grantable === false ? t("common:roleChoice.notGrantableIn", { company: companies.knownItems.find((item) => item.id === company.field.value)?.name ?? "" }) : undefined }))} value={companyRoleIds.field.value} onChange={companyRoleIds.field.onChange} placeholder={t("users:invite.noRoles")} />
                : <Picker multiple disabled value={[]} options={[]} onChange={() => {}} placeholder={t("users:invite.chooseCompanyFirst")} />}
            </FormField>
          </div>
          {/* Usuarios-Invitar-Propuesta (.acc-dlg-av): antes de «Invitar», que invitar manda la invitación. */}
          {proposed && !alreadySaved ? <Banner>{t("users:invite.sendsInvitation")}</Banner> : null}
          {/* «Criterio · Diálogos»: el error general, en la franja arriba de los botones. */}
          <FormError message={rateLimitedActionMessage(failure, t)} />
        </DialogBody>
        {/* «Ya se guardó»: ya no se invita; «Ver en Usuarios» lleva a la lista, donde está la invitación. */}
        {alreadySaved ? <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.close")}</Button>
          <Button asChild><Link to="/org/usuarios">{t("users:invite.seeInUsers")}</Link></Button>
        </DialogFooter> : <DialogFooter>
          <Button type="button" variant="outline" disabled={proposed !== undefined && pending} onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={limit.isRunning} pending={pending} pendingLabel={t("users:invite.sending")}>{limit.label ?? t("users:invite.send")}</Button>
        </DialogFooter>}
      </form>
    </DialogContent>
  </Dialog>;
}

/** El diálogo de una propuesta del asistente (users.invite@1), sobre el Inicio: después de invitar se vuelve a leer Usuarios
 * y lo que muestra la pantalla de abajo (`onSaved`: el conteo de usuarios del Inicio, que cuenta las invitaciones). */
export function InviteUserProposalDialog({ onClose, onSaved }: { onClose: () => void; onSaved?: () => Promise<unknown> }) {
  const client = useQueryClient();
  return <InviteUserDialog onClose={onClose} onInvited={() => Promise.all([client.invalidateQueries({ queryKey: usersQueryRoot }), onSaved?.()])} />;
}
