import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { TimeField } from "@/shared/ui/fields/TimeField";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { IconButton } from "@/shared/ui/IconButton";
import { PencilIcon } from "@/shared/ui/icons";
import { Picker } from "@/shared/ui/Picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";
import type { WhatsAppBotSchedule } from "../../api/types";
import { timeOf, weekDays, type BotPatch } from "../lib/botModel";
import { useBotDialogSave } from "./useBotDialogSave";

const textLimit = validationConstraints.UpdateWhatsAppBotHttpRequest.outOfHours.maxLength;

interface DayValue { open: boolean; from: string | null; to: string | null }

/// «Fuera de horario» (WA-Respuestas-Base2 y su M-): el texto que manda el bot fuera del horario de atención, la zona
/// horaria del catálogo y los días en una tabla, «Día» y «Horario», con el lápiz de cada uno. El lápiz abre el día en su
/// diálogo («La atención de un día»), y lo que se cambia ahí se guarda con «Guardar cambios». Un día sin atención dice
/// «Cerrado». Sin interruptor: el bot no se apaga (D9).
export function OutOfHoursDialog({ outOfHours, schedule, onSave, onClose, returnFocusTo }: {
  outOfHours: string;
  schedule: WhatsAppBotSchedule;
  onSave: (patch: BotPatch) => Promise<unknown>;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const format = useFormat();
  const id = useId();
  const schema = z.object({
    text: z.string().trim().min(1, t("whatsapp:bot.validation.required")).max(textLimit),
    timeZoneId: z.string().min(1, t("whatsapp:bot.validation.required")),
    days: z.array(z.object({ open: z.boolean(), from: z.string().nullable(), to: z.string().nullable() })),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    text: outOfHours, timeZoneId: schedule.timeZoneId,
    days: weekDays.map((weekDay): DayValue => {
      const found = schedule.days.find((item) => item.day === weekDay);
      return { open: found !== undefined, from: timeOf(found?.from), to: timeOf(found?.to) };
    }),
  } });
  const zone = useController({ control: form.control, name: "timeZoneId" });
  const days = useWatch({ control: form.control, name: "days" });
  const { failure, clear, close, pending, submit } = useBotDialogSave(onSave, onClose);
  const errors = form.formState.errors;
  // El día que se edita y su lápiz, adonde vuelve el foco al cerrar su diálogo.
  const [editing, setEditing] = useState<{ index: number; trigger: HTMLElement } | null>(null);

  function setDay(index: number, value: DayValue) {
    form.setValue(`days.${index}`, value, { shouldDirty: true });
    clear();
  }

  const send = form.handleSubmit((values) => submit({
    outOfHours: values.text.trim(),
    schedule: { timeZoneId: values.timeZoneId, days: weekDays.flatMap((weekDay, index) => {
      const value = values.days[index];
      return value.open && value.from && value.to ? [{ day: weekDay, from: value.from, to: value.to }] : [];
    }) },
  }));

  const labelId = `${id}-days`;
  const dayName = (index: number) => format.formatEnum("DayOfWeek", weekDays[index]);
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("whatsapp:bot.outOfHours.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void send(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("whatsapp:bot.text")} required error={errors.text?.message}>
            <Textarea rows={3} maxLength={textLimit} {...form.register("text", { onChange: clear })} />
          </FormField>
          <FormField label={t("whatsapp:bot.outOfHours.timeZone")} required error={errors.timeZoneId?.message}>
            <TimeZoneSelect value={zone.field.value} onChange={(value) => { zone.field.onChange(value); clear(); }} placeholder={t("whatsapp:bot.outOfHours.timeZone")} />
          </FormField>
          <div className="flex flex-col gap-1.5">
            <span id={labelId} className="text-[0.78125rem] font-semibold text-[var(--t2)] max-md:text-[0.84375rem]">{t("whatsapp:bot.outOfHours.days")}</span>
            {/* WA-Respuestas-Base2: «Día», «Horario» y el lápiz de cada día, en la caja de una tabla. */}
            <div className="overflow-hidden rounded-[0.625rem] border border-[var(--borde)]">
              <Table aria-labelledby={labelId} className={phone ? "text-[0.9375rem]" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-3">{t("whatsapp:bot.outOfHours.columns.day")}</TableHead>
                    <TableHead className="border-l border-[var(--borde)] px-3">{t("whatsapp:bot.outOfHours.columns.hours")}</TableHead>
                    <TableHead className="w-11"><span className="sr-only">{t("whatsapp:bot.outOfHours.columns.actions")}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weekDays.map((weekDay, index) => {
                    const value = days[index];
                    const name = dayName(index);
                    return <TableRow key={weekDay}>
                      <TableCell className="px-3">{name}</TableCell>
                      <TableCell className={value.open ? "border-l border-[var(--borde)] px-3" : "border-l border-[var(--borde)] px-3 text-[var(--t3)]"}>
                        {value.open && value.from && value.to ? t("whatsapp:bot.outOfHours.hours", { from: format.formatTime(value.from), to: format.formatTime(value.to) }) : t("whatsapp:bot.outOfHours.closed")}
                      </TableCell>
                      <TableCell className="py-0 pr-1 text-right">
                        <IconButton label={t("whatsapp:bot.outOfHours.editDay", { day: name })}
                          onClick={(event) => setEditing({ index, trigger: event.currentTarget })}><PencilIcon className="size-4" /></IconButton>
                      </TableCell>
                    </TableRow>;
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={!form.formState.isDirty} pending={pending}>{t(phone ? "common:actions.save" : "whatsapp:bot.saveChanges")}</Button>
        </DialogFooter>
      </form>
      {editing !== null ? <DayDialog key={editing.index} name={dayName(editing.index)} value={days[editing.index]}
        inSentence={t(`whatsapp:bot.schedule.dayInText.${weekDays[editing.index]}`)}
        nearest={days.find((item, other) => item.open && other !== editing.index)} returnFocusTo={editing.trigger}
        onDone={(value) => { setDay(editing.index, value); setEditing(null); }} onClose={() => setEditing(null)} /> : null}
    </DialogContent>
  </Dialog>;
}

/// «La atención de un día» (WA-Respuestas-Base2, «Editar un día» y «Un día cerrado»): abierto o cerrado en la pieza y, si
/// atiende, desde y hasta qué hora. Abrir un día cerrado copia el horario del día abierto más cercano. «Listo» lo pasa a la
/// tabla; se guarda con el resto. La pieza se llama «Atención del lunes»: en el teléfono es el título de su lista
/// (M-WA-Respuestas-Base2, «La atención de un día»).
function DayDialog({ name, inSentence, value, nearest, onDone, onClose, returnFocusTo }: {
  name: string;
  inSentence: string;
  value: DayValue;
  nearest: DayValue | undefined;
  onDone: (value: DayValue) => void;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const [draft, setDraft] = useState<DayValue>(value);
  const [error, setError] = useState<string | null>(null);

  function attention(choice: string) {
    const open = choice === "open";
    setDraft(open ? { open, from: draft.from ?? nearest?.from ?? null, to: draft.to ?? nearest?.to ?? null } : { ...draft, open });
    setError(null);
  }
  function done() {
    if (draft.open && (!draft.from || !draft.to)) { setError(t("whatsapp:bot.validation.hours")); return; }
    if (draft.open && draft.from && draft.to && draft.from >= draft.to) { setError(t("whatsapp:bot.validation.hoursOrder")); return; }
    onDone(draft);
  }

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus} className="sm:max-w-[23.75rem]">
      <DialogHeader><DialogTitle>{name}</DialogTitle></DialogHeader>
      <DialogBody>
        <FormField label={t("whatsapp:bot.outOfHours.attention")}>
          <Picker label={t("whatsapp:bot.outOfHours.attentionOf", { day: inSentence })} value={draft.open ? "open" : "closed"} onChange={attention} options={[
            { value: "open", label: t("whatsapp:bot.outOfHours.open"), description: t("whatsapp:bot.outOfHours.openHelp") },
            { value: "closed", label: t("whatsapp:bot.outOfHours.closed"), description: t("whatsapp:bot.outOfHours.closedHelp") },
          ]} />
        </FormField>
        {draft.open ? <div className="grid grid-cols-2 gap-3">
          <FormField label={t("whatsapp:bot.outOfHours.from")}>
            <TimeField value={draft.from} onChange={(from) => { setDraft({ ...draft, from }); setError(null); }} />
          </FormField>
          <FormField label={t("whatsapp:bot.outOfHours.until")} error={error ?? undefined}>
            <TimeField value={draft.to} onChange={(to) => { setDraft({ ...draft, to }); setError(null); }} />
          </FormField>
        </div> : null}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
        <Button type="button" onClick={done}>{t("common:actions.done")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
