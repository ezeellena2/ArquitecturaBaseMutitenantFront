import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { Picker } from "@/shared/ui/Picker";
import { Textarea } from "@/shared/ui/textarea";
import type { WhatsAppBotAction, WhatsAppBotMenuOption, WhatsAppTeamResponse } from "../../api/types";
import { findMenuOption, replaceMenuOption, type BotData, type BotSave, type MenuOptionTarget } from "../lib/botModel";
import { useBotDialogSave } from "./useBotDialogSave";

const labelLimit = validationConstraints.WhatsAppBotMenuOptionInput.label.maxLength;
const replyLimit = validationConstraints.WhatsAppBotMenuOptionInput.reply.maxLength;
const actions: readonly WhatsAppBotAction[] = ["Team", "Reply"];

/// «Editar opción 1» (WA-Admin-Editar y M-WA-Editar) y «Agregar opción»: el texto que ve el cliente en la lista, qué hace
/// (pasa a un equipo o contesta un texto) y el equipo o el texto. Guarda el menú entero de la instantánea congelada al
/// abrir con la opción cambiada (identificada por `id`, no por posición viva).
///
/// Ninguna elección se descarta en silencio (162): cambiar lo que hace conserva el texto de la opción y, si se pierde el
/// texto escrito o el equipo elegido, lo pregunta antes («¿Cambiar a «Pasa a un equipo»? Se quita el texto.»). La pregunta
/// toma el lugar de la opción, que queda montada y oculta detrás, nunca un diálogo encima de otro; es una confirmación
/// sin ✕, con el foco en «Cancelar». «Cancelar» o Escape vuelven a la opción tal cual; «Cambiar» cambia la acción y quita
/// lo que ya no va. Sin nada escrito, cambia sin preguntar.
export function OptionDialog<TBot extends BotData>({ bot, target, number, teams, onSave, onClose, returnFocusTo, onRemove, removing = false }: {
  /** Instantánea congelada del bot al abrir el diálogo: su menú y su versión no cambian por una relectura de fondo. */
  bot: TBot;
  /** La opción que se edita (por su `id`, o por posición en la instantánea si no tiene); sin destino, se agrega al final. */
  target: MenuOptionTarget | null;
  /** El número visible en el título («Editar opción 3»), congelado al abrir. */
  number: number | null;
  /** Los equipos a los que puede pasar (en la organización, los de la bandeja Clientes). */
  teams: readonly WhatsAppTeamResponse[];
  onSave: BotSave<TBot>;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
  /** En el teléfono, quitar la opción que se edita (no la del sistema): un botón de peligro debajo de Guardar. */
  onRemove?: () => void;
  removing?: boolean;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const current = target === null ? null : findMenuOption(bot.menu, target);
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
  const { failure, clear, close, pending, submit } = useBotDialogSave(bot, onSave, onClose);
  const errors = form.formState.errors;
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  // La acción a la que se quiere pasar mientras se pregunta si se quita lo que ya no va.
  const [switching, setSwitching] = useState<WhatsAppBotAction | null>(null);
  const actionsId = useId();
  const questionId = useId();
  const asked = useRef(false);

  // La pregunta arranca con el foco en «Cancelar» (Criterio-Dialogos, «Decidir a propósito»). Al responderla, el foco
  // vuelve al campo «Qué hace», que ya dice la acción que quedó elegida, como vuelve el de un diálogo a lo que lo abrió; antes de que
  // Radix lo mande al diálogo entero porque se fue el botón que lo tenía.
  useLayoutEffect(() => {
    if (switching) { asked.current = true; return; }
    if (!asked.current) return;
    asked.current = false;
    document.getElementById(actionsId)?.focus();
  }, [switching, actionsId]);

  const apply = (next: WhatsAppBotAction) => { action.field.onChange(next); clear(); };
  // Pasar a un equipo pierde el texto escrito; pasar a un texto, el equipo elegido. Unos espacios no son un texto.
  const choose = (value: string) => {
    const next = actions.find((item) => item === value);
    if (!next || next === action.field.value) return;
    const loses = next === "Team" ? form.getValues("reply").trim() !== "" : form.getValues("teamId") !== "";
    if (loses) setSwitching(next);
    else apply(next);
  };
  const answer = (change: boolean) => {
    if (change && switching) {
      form.setValue(switching === "Team" ? "reply" : "teamId", "", { shouldDirty: true });
      apply(switching);
    }
    setSwitching(null);
  };

  const send = form.handleSubmit((values) => {
    const option: WhatsAppBotMenuOption = { id: current?.id ?? null, label: values.label.trim(), action: values.action, isSystem: false,
      teamId: values.action === "Team" ? values.teamId : null, reply: values.action === "Reply" ? values.reply.trim() : null };
    submit({ menu: target === null ? [...bot.menu, option] : replaceMenuOption(bot.menu, target, option) });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" role={switching ? "alertdialog" : "dialog"} showCloseButton={!switching}
      aria-describedby={switching ? questionId : undefined} onCloseAutoFocus={restoreFocus}
      onEscapeKeyDown={(event) => { if (switching) { event.preventDefault(); answer(false); } }}>
      {switching ? <>
        <DialogHeader><DialogTitle>{t("whatsapp:bot.option.change.title", { action: format.formatEnum("WhatsAppBotAction", switching) })}</DialogTitle></DialogHeader>
        {/* Como ConfirmDialog: el texto con la letra de los diálogos, con 20 de margen en la compu y 8/20/16 en la hoja. */}
        <DialogDescription id={questionId} className="p-5 max-md:pt-2 max-md:pb-4">
          {switching === "Team" ? t("whatsapp:bot.option.change.dropsReply") : t("whatsapp:bot.option.change.dropsTeam")}
        </DialogDescription>
        <DialogFooter>
          <Button type="button" variant="outline" autoFocus onClick={() => answer(false)}>{t("common:actions.cancel")}</Button>
          <Button type="button" onClick={() => answer(true)}>{t("whatsapp:bot.option.change.confirm")}</Button>
        </DialogFooter>
      </> : <DialogHeader><DialogTitle>{number === null ? t("whatsapp:bot.option.addTitle") : t("whatsapp:bot.option.editTitle", { number })}</DialogTitle></DialogHeader>}
      <form noValidate hidden={switching !== null} onSubmit={(event) => { void send(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("whatsapp:bot.option.label")} required error={errors.label?.message}>
            <Input maxLength={labelLimit} {...form.register("label", { onChange: clear })} />
          </FormField>
          <FormField label={t("whatsapp:bot.option.action")}>
            <Picker id={actionsId} value={action.field.value} onChange={choose}
              options={actions.map((value) => ({ value, label: format.formatEnum("WhatsAppBotAction", value) }))} />
          </FormField>
          {chosen === "Team" ? <FormField label={t("whatsapp:bot.option.team")} required error={errors.teamId?.message}>
            <Picker value={team.field.value || null} onChange={(value) => { if (value === team.field.value) return; team.field.onChange(value); clear(); }}
              placeholder={teams.length === 0 ? t("whatsapp:bot.option.noTeams") : t("whatsapp:bot.option.chooseTeam")}
              options={teams.map((item) => ({ value: item.id, label: item.name }))} />
          </FormField> : <FormField label={t("whatsapp:bot.text")} required error={errors.reply?.message}>
            <Textarea rows={3} maxLength={replyLimit} {...form.register("reply", { onChange: clear })} />
          </FormField>}
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter className={onRemove ? "flex-wrap" : undefined}>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={Boolean(current) && !form.formState.isDirty} pending={pending}>{t("common:actions.save")}</Button>
          {onRemove ? <Button type="button" variant="danger" className="basis-full" onClick={onRemove} pending={removing}
            pendingLabel={t("whatsapp:bot.option.removing")}>{t("whatsapp:bot.option.removeOption")}</Button> : null}
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
