import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { TimeField } from "@/shared/ui/fields/TimeField";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Textarea } from "@/shared/ui/textarea";
import type { WhatsAppBotSchedule } from "../../api/types";
import { timeOf, weekDays, type BotPatch } from "../lib/botModel";
import { useBotDialogSave } from "./useBotDialogSave";

const textLimit = validationConstraints.UpdateWhatsAppBotHttpRequest.outOfHours.maxLength;

interface DayValue { open: boolean; from: string | null; to: string | null }

/// «Fuera de horario» (WA-Respuestas, «Editar fuera de horario», y M-WA-Respuestas): el texto que manda el bot fuera del
/// horario de atención, la zona horaria del catálogo y, por día, si se atiende y de qué hora a qué hora. Un día sin
/// atención dice «Cerrado». Sin interruptor: el bot no se apaga (D9).
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
  const day = z.object({ open: z.boolean(), from: z.string().nullable(), to: z.string().nullable() }).superRefine((value, context) => {
    if (!value.open) return;
    if (!value.from || !value.to) context.addIssue({ code: "custom", path: ["to"], message: t("whatsapp:bot.validation.hours") });
    else if (value.from >= value.to) context.addIssue({ code: "custom", path: ["to"], message: t("whatsapp:bot.validation.hoursOrder") });
  });
  const schema = z.object({
    text: z.string().trim().min(1, t("whatsapp:bot.validation.required")).max(textLimit),
    timeZoneId: z.string().min(1, t("whatsapp:bot.validation.required")),
    days: z.array(day),
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

  function setDay(index: number, value: DayValue) {
    form.setValue(`days.${index}`, value, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    clear();
  }
  // Abrir un día copia el horario del día abierto más cercano, si hay alguno.
  function toggle(index: number, open: boolean) {
    const nearest = days.find((item, other) => item.open && other !== index);
    setDay(index, open ? { open, from: days[index].from ?? nearest?.from ?? null, to: days[index].to ?? nearest?.to ?? null } : { ...days[index], open });
  }

  const send = form.handleSubmit((values) => submit({
    outOfHours: values.text.trim(),
    schedule: { timeZoneId: values.timeZoneId, days: weekDays.flatMap((weekDay, index) => {
      const value = values.days[index];
      return value.open && value.from && value.to ? [{ day: weekDay, from: value.from, to: value.to }] : [];
    }) },
  }));

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
          <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
            <legend className="mb-1.5 text-[12.5px] font-semibold text-[var(--t2)] max-md:text-[13.5px]">{t("whatsapp:bot.outOfHours.days")}</legend>
            {/* WA-Respuestas (.e11-dias y .e11-dia): una fila por día, alternadas, con la casilla, el día y las dos horas. */}
            <div className={phone ? "flex flex-col" : "flex flex-col overflow-hidden rounded-[10px] border border-[var(--borde)]"}>
              {weekDays.map((weekDay, index) => {
                const value = days[index];
                const name = format.formatEnum("DayOfWeek", weekDay);
                const rowError = errors.days?.[index]?.to?.message;
                const checkId = `${id}-${weekDay}`;
                return <div key={weekDay} className={phone ? "border-b border-[var(--borde)] py-1.5 last:border-b-0"
                  : "border-t border-[var(--borde)] px-3 py-1.5 first:border-t-0 even:bg-[var(--s2)]"}>
                  <div className={phone ? "grid min-h-12 grid-cols-[28px_1fr_auto] items-center gap-2.5 text-[16px]" : "grid min-h-10 grid-cols-[26px_1fr_96px_18px_96px] items-center gap-2 text-[13.5px]"}>
                    <Checkbox id={checkId} checked={value.open} onCheckedChange={(checked) => toggle(index, checked === true)} className="size-[18px]" />
                    <label htmlFor={checkId} className={value.open ? "text-[var(--t1)]" : "text-[var(--t3)]"}>{name}</label>
                    {value.open ? <>
                      <span className={phone ? "flex items-center gap-2" : "contents"}>
                        <label htmlFor={`${checkId}-from`} className="sr-only">{t("whatsapp:bot.outOfHours.from", { day: name })}</label>
                        <span className={phone ? "w-24" : undefined}><TimeField id={`${checkId}-from`} value={value.from} onChange={(from) => setDay(index, { ...value, from })} /></span>
                        <span aria-hidden="true" className="text-center text-[var(--t3)]">{t("whatsapp:bot.outOfHours.to")}</span>
                        <label htmlFor={`${checkId}-to`} className="sr-only">{t("whatsapp:bot.outOfHours.until", { day: name })}</label>
                        <span className={phone ? "w-24" : undefined}><TimeField id={`${checkId}-to`} value={value.to} onChange={(to) => setDay(index, { ...value, to })}
                          aria-invalid={rowError ? true : undefined} aria-describedby={rowError ? `${checkId}-error` : undefined} /></span>
                      </span>
                    </> : <span className={phone ? "text-[15px] text-[var(--t3)]" : "col-span-3 text-[var(--t3)]"}>{t("whatsapp:bot.outOfHours.closed")}</span>}
                  </div>
                  {rowError ? <p id={`${checkId}-error`} role="alert" className="pb-1 text-[12.5px] text-[var(--peligro)]">{rowError}</p> : null}
                </div>;
              })}
            </div>
          </fieldset>
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={!form.formState.isDirty} pending={pending}>{t(phone ? "common:actions.save" : "whatsapp:bot.saveChanges")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
