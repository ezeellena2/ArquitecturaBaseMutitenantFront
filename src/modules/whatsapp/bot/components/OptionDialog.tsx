import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { RadioGroupField } from "@/shared/ui/RadioGroupField";
import { SearchSelect } from "@/shared/ui/SearchSelect";
import { Textarea } from "@/shared/ui/textarea";
import type { WhatsAppBotAction, WhatsAppBotMenuOption, WhatsAppTeamResponse } from "../../api/types";
import type { BotPatch } from "../lib/botModel";
import { useBotDialogSave } from "./useBotDialogSave";

const labelLimit = validationConstraints.WhatsAppBotMenuOptionInput.label.maxLength;
const replyLimit = validationConstraints.WhatsAppBotMenuOptionInput.reply.maxLength;
const actions: readonly WhatsAppBotAction[] = ["Team", "Reply"];

/// «Editar opción 1» (WA-Admin-Editar y M-WA-Editar) y «Agregar opción»: el texto que ve el cliente en la lista, qué hace
/// (pasa a un equipo o contesta un texto) y el equipo o el texto. Guarda el menú entero con la opción cambiada.
export function OptionDialog({ menu, index, teams, onSave, onClose, returnFocusTo }: {
  menu: readonly WhatsAppBotMenuOption[];
  /** La opción que se edita; sin índice, se agrega al final. */
  index: number | null;
  /** Los equipos a los que puede pasar (en la organización, los de la bandeja Clientes). */
  teams: readonly WhatsAppTeamResponse[];
  onSave: (patch: BotPatch) => Promise<unknown>;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const current = index === null ? null : menu[index] ?? null;
  const required = t("whatsapp:bot.validation.required");
  const schema = z.object({
    label: z.string().trim().min(1, required).max(labelLimit),
    action: z.enum(["Team", "Reply"]),
    teamId: z.string(),
    reply: z.string().max(replyLimit),
  }).superRefine((value, context) => {
    if (value.action === "Team" && !value.teamId) context.addIssue({ code: "custom", path: ["teamId"], message: required });
    if (value.action === "Reply" && !value.reply.trim()) context.addIssue({ code: "custom", path: ["reply"], message: required });
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    label: current?.label ?? "", action: current?.action ?? "Team", teamId: current?.teamId ?? "", reply: current?.reply ?? "",
  } });
  const action = useController({ control: form.control, name: "action" });
  const team = useController({ control: form.control, name: "teamId" });
  const chosen = useWatch({ control: form.control, name: "action" });
  const { failure, clear, close, pending, submit } = useBotDialogSave(onSave, onClose);
  const errors = form.formState.errors;
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);

  const send = form.handleSubmit((values) => {
    const option: WhatsAppBotMenuOption = { id: current?.id ?? null, label: values.label.trim(), action: values.action, isSystem: false,
      teamId: values.action === "Team" ? values.teamId : null, reply: values.action === "Reply" ? values.reply.trim() : null };
    submit({ menu: index === null ? [...menu, option] : menu.map((item, position) => position === index ? option : item) });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{index === null ? t("whatsapp:bot.option.addTitle") : t("whatsapp:bot.option.editTitle", { number: index + 1 })}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void send(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("whatsapp:bot.option.label")} required error={errors.label?.message}>
            <Input maxLength={labelLimit} {...form.register("label", { onChange: clear })} />
          </FormField>
          <FormField label={t("whatsapp:bot.option.action")}>
            <RadioGroupField variant="segmented" label={t("whatsapp:bot.option.action")} value={action.field.value}
              onValueChange={(value) => { action.field.onChange(value); clear(); }}
              options={actions.map((value) => ({ value, label: format.formatEnum("WhatsAppBotAction", value) }))} />
          </FormField>
          {chosen === "Team" ? <FormField label={t("whatsapp:bot.option.team")} required error={errors.teamId?.message}>
            <SearchSelect value={team.field.value} onChange={(value) => { team.field.onChange(value); clear(); }}
              placeholder={teams.length === 0 ? t("whatsapp:bot.option.noTeams") : t("whatsapp:bot.option.chooseTeam")} searchLabel={t("common:actions.search")}
              options={teams.map((item) => ({ value: item.id, label: item.name }))} />
          </FormField> : <FormField label={t("whatsapp:bot.text")} required error={errors.reply?.message}>
            <Textarea rows={3} maxLength={replyLimit} {...form.register("reply", { onChange: clear })} />
          </FormField>}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={Boolean(current) && !form.formState.isDirty} pending={pending}>{t("common:actions.save")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
