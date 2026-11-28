import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Picker } from "@/shared/ui/Picker";
import type { WhatsAppTeamResponse } from "../../api/types";
import type { BotData, BotSave } from "../lib/botModel";
import { useBotDialogSave } from "./useBotDialogSave";

const noTeam = "none";
const schema = z.object({ team: z.string() });

/// «Mensajes de empleados» (WA-Respuestas, «Además»): a qué equipo de la bandeja Internos pasan, sin menú, los mensajes
/// de los números de cuentas de la organización. Sin equipo, quedan en Internos.
export function EmployeesTeamDialog<TBot extends BotData>({ bot, teams, onSave, onClose, returnFocusTo }: {
  bot: TBot;
  /** Los equipos de la bandeja Internos. */
  teams: readonly WhatsAppTeamResponse[];
  onSave: BotSave<TBot>;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { team: bot.employeesTeamId ?? noTeam } });
  const team = useController({ control: form.control, name: "team" });
  const { failure, clear, close, pending, submit } = useBotDialogSave(bot, onSave, onClose);
  const send = form.handleSubmit((values) => submit({ employeesTeamId: values.team === noTeam ? null : values.team }));

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("whatsapp:bot.employees.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void send(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("whatsapp:bot.option.team")}>
            <Picker value={team.field.value || noTeam} onChange={(value) => { if (value === team.field.value) return; team.field.onChange(value); clear(); }}
              first={{ value: noTeam, label: t("whatsapp:bot.employees.noTeam") }} options={teams.map((item) => ({ value: item.id, label: item.name }))} />
          </FormField>
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={!form.formState.isDirty} pending={pending}>{t("common:actions.save")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
