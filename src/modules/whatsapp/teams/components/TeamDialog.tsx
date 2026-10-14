import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { RadioGroupField } from "@/shared/ui/RadioGroupField";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/Spinner";
import type { CreateWhatsAppTeamRequest, UpdateWhatsAppTeamRequest, WhatsAppTeamDetailResponse, WhatsAppTeamResponse } from "../../api/types";
import { createTeam, fetchTeam, teamMemberOptions, teamQueryKey, teamsQueryRoot, updateTeam, type TeamScope } from "../api/teams";
import { teamErrorField } from "../errors";
import { noNotice, noticeFieldValue, noticeMinutes, noticeMinutesFrom } from "../lib/notice";

const inboxes = ["Customers", "Internal"] as const;
const nameMaxLength = validationConstraints.CreateWhatsAppTeamHttpRequest.name.maxLength;

/// Se revisa al tocar el botón («Criterio · Botones»): el nombre y al menos una persona; la bandeja y el aviso siempre
/// tienen una opción elegida.
function teamFormSchema(t: TFunction, scope: TeamScope) {
  return z.object({
    name: z.string().trim().min(1, t("whatsapp:teams.form.nameRequired")),
    inbox: z.enum(inboxes),
    memberIds: z.array(z.string()).min(1, t(scope === "organization" ? "whatsapp:teams.form.membersRequired" : "whatsapp:teams.form.operatorsRequired")),
    notice: z.string(),
  });
}

type TeamForm = z.input<ReturnType<typeof teamFormSchema>>;
type TeamValues = z.output<ReturnType<typeof teamFormSchema>>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof TeamForm> = { name: "name", inbox: "inbox", memberIds: "memberIds", notifyAfterMinutes: "notice" };

/// Al editar, lo guardado; al crear, la bandeja Clientes y el aviso a los 10 minutos (WA-Equipos-Crear).
function valuesFromTeam(team: WhatsAppTeamDetailResponse | undefined): TeamForm {
  return team ? { name: team.name, inbox: team.inbox ?? "Customers", memberIds: team.members.items.map((member) => member.id), notice: noticeFieldValue(team.notifyAfterMinutes) }
    : { name: "", inbox: "Customers", memberIds: [], notice: String(noticeMinutes[0]) };
}

/// Otro envío con lo mismo conserva la clave del alta; con algo corregido, va con una nueva (datos-y-api.md).
function sameTeam(previous: CreateWhatsAppTeamRequest, next: CreateWhatsAppTeamRequest): boolean {
  const before = previous.memberIds ?? [];
  const after = next.memberIds ?? [];
  return previous.name === next.name && previous.inbox === next.inbox && previous.notifyAfterMinutes === next.notifyAfterMinutes
    && before.length === after.length && before.every((id, index) => id === after[index]);
}

/**
 * «Crear equipo» y su edición (tableros WA-Equipos-Crear, M-WA-Equipos-Crear y Plat-WA-Equipos): el nombre, la bandeja
 * (solo en la organización; Plataforma no elige bandeja), quiénes lo forman y el aviso por correo si nadie toma un chat.
 * Se monta solo abierto; al editar, lee el equipo para saber quiénes son, y la bandeja ya no se cambia.
 */
export function TeamDialog({ scope, team, onClose, returnFocusTo }: {
  scope: TeamScope;
  /** Sin equipo, lo crea; con uno, lo edita con la versión que trae su lectura. */
  team?: WhatsAppTeamResponse;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const detail = useQuery({
    queryKey: teamQueryKey(scope, team?.id ?? ""), queryFn: ({ signal }) => fetchTeam(scope, team?.id ?? "", signal),
    enabled: Boolean(team), staleTime: 0, meta: { silent: true },
  });
  const title = t(team ? "whatsapp:teams.editTitle" : "whatsapp:teams.create");

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      {!team ? <TeamFormBody scope={scope} onClose={onClose} />
        : detail.data ? <TeamFormBody key={detail.data.id} scope={scope} team={detail.data} onClose={onClose} />
          : <>
            <DialogBody>{detail.isError ? <FormError message={apiErrorMessage(detail.error, t)} /> : <div className="flex justify-center py-6"><Spinner /></div>}</DialogBody>
            <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button></DialogFooter>
          </>}
    </DialogContent>
  </Dialog>;
}

function TeamFormBody({ scope, team, onClose }: { scope: TeamScope; team?: WhatsAppTeamDetailResponse; onClose: () => void }) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const queryClient = useQueryClient();
  const schema = useMemo(() => teamFormSchema(t, scope), [t, scope]);
  const { form, version } = useEditForm<WhatsAppTeamDetailResponse | undefined, TeamForm, TeamValues>({
    read: team, toValues: valuesFromTeam, resolver: zodResolver(schema),
  });
  const inbox = useController({ control: form.control, name: "inbox" });
  const members = useController({ control: form.control, name: "memberIds" });
  const notice = useController({ control: form.control, name: "notice" });
  const options = useResourceOptions(teamMemberOptions(scope));
  const known = [...(team?.members.items ?? []), ...options.knownItems];
  const { failure, clear, fail, close } = useDialogFailure(onClose, teamsQueryRoot(scope));
  const create = useIdempotentMutation((request: CreateWhatsAppTeamRequest, key) => createTeam(scope, request, key), { sameOperation: sameTeam });
  const update = useMutation({ mutationFn: ({ id, request }: { id: string; request: UpdateWhatsAppTeamRequest }) => updateTeam(scope, id, request) });
  const organization = scope === "organization";
  const errors = form.formState.errors;

  // El nombre repetido va debajo del nombre (`errors.ts`); lo demás, como el 409 de otra persona, en la franja.
  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    const field = teamErrorField(error);
    if (field && error instanceof ApiError) form.setError(field, { type: "server", message: error.detail ?? "" });
    else fail(error);
  }

  async function saved(name: string, created: boolean) {
    toast.success(t(created ? "whatsapp:teams.messages.created" : "whatsapp:teams.messages.updated", { name }));
    onClose();
    await queryClient.invalidateQueries({ queryKey: teamsQueryRoot(scope) });
  }

  // Lo que sigue al guardado va en sus callbacks: «Reintentar» (sin conexión) los vuelve a correr con la misma clave.
  const submit = form.handleSubmit((values) => {
    clear();
    const notifyAfterMinutes = noticeMinutesFrom(values.notice);
    if (team) {
      update.mutate({ id: team.id, request: { name: values.name, memberIds: values.memberIds, notifyAfterMinutes, version } }, {
        onSuccess: () => { void saved(values.name, false); }, onError: rejected,
      });
    } else {
      const request: CreateWhatsAppTeamRequest = { name: values.name, inbox: organization ? values.inbox : null, memberIds: values.memberIds, notifyAfterMinutes };
      create.mutate(request, { onSuccess: () => { void saved(values.name, true); }, onError: rejected });
    }
  });

  const membersLabel = t(organization ? "whatsapp:teams.form.members" : "whatsapp:teams.form.operators");
  return <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
    <DialogBody>
      <div className="grid gap-3.5 md:grid-cols-2">
        <div className={organization ? undefined : "md:col-span-2"}>
          <FormField label={t("whatsapp:teams.form.name")} required error={errors.name?.message}>
            <Input autoComplete="off" maxLength={nameMaxLength} {...form.register("name", { onChange: clear })} />
          </FormField>
        </div>
        {organization ? team
          ? <ReadOnlyField label={t("whatsapp:teams.form.inbox")}>{t(`whatsapp:teams.inboxOption.${inbox.field.value}`)}</ReadOnlyField>
          : <FormField label={t("whatsapp:teams.form.inbox")} required error={errors.inbox?.message}>
            <RadioGroupField variant="segmented" label={t("whatsapp:teams.form.inbox")} value={inbox.field.value}
              options={inboxes.map((value) => ({ value, label: t(`whatsapp:teams.inboxOption.${value}`) }))}
              onValueChange={(value) => inbox.field.onChange(value)} />
          </FormField> : null}
        <div className="md:col-span-2">
          <FormField label={membersLabel} required error={errors.memberIds?.message}>
            <MultiSelect remote={options.remote} value={members.field.value} onChange={(value) => { clear(); members.field.onChange(value); }}
              selectedOptions={known.map((member) => ({ value: member.id, label: member.name }))}
              options={options.items.map((member) => ({ value: member.id, label: member.name }))}
              placeholder={t(organization ? "whatsapp:teams.form.noMembers" : "whatsapp:teams.form.noOperators")} />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label={t("whatsapp:teams.form.notice")} error={errors.notice?.message}>
            <Select value={notice.field.value} onValueChange={(value) => { clear(); notice.field.onChange(value); }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {noticeMinutes.map((minutes) => <SelectItem key={minutes} value={String(minutes)}>{t("whatsapp:teams.notice.after", { minutes })}</SelectItem>)}
                <SelectItem value={noNotice}>{t("whatsapp:teams.notice.none")}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>
      {/* «Criterio · Diálogos»: el error general, también el 409, en la franja arriba de los botones. */}
      <FormError message={actionErrorMessage(failure, t)} />
    </DialogBody>
    <DialogFooter>
      <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
      <Button type="submit" disabled={Boolean(team) && !form.formState.isDirty} pending={create.isPending || update.isPending}>
        {t(team ? "whatsapp:teams.save" : "whatsapp:teams.create")}
      </Button>
    </DialogFooter>
  </form>;
}
