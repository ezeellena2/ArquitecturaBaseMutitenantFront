import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Clock, Send, StickyNote } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { validationConstraints } from "@/shared/api/generated/validation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { InfoButton } from "@/shared/ui/InfoButton";
import { Textarea } from "@/shared/ui/textarea";
import type { ComposerState } from "../lib/conversation";

export type ComposerNotice = "window" | "readOnly" | "payment" | "paymentTemplate";

const maxLength = validationConstraints.SendWhatsAppMessageHttpRequest.text.maxLength;
const schema = z.object({ text: z.string().trim().min(1).max(maxLength) });

/// La barra de abajo del chat (WA-Chats .w-escr y M-WA-Conversacion .ap-escr). Según el estado: el campo con «Enviar»;
/// «Lo atiende …» si es de otra persona; «Pasaron 24 horas» con su ⓘ y «Elegir plantilla»; «Sin medio de pago» o
/// «Número desconectado» con su ⓘ. El botón de la nota interna (salvo con el número desconectado) cambia el campo a una
/// nota para el equipo, que nunca le llega al contacto.
export function ChatComposer({ state, phone, sendPending, notePending, onSend, onNote, onChooseTemplate, onExplain }: {
  state: ComposerState;
  phone: boolean;
  sendPending: boolean;
  notePending: boolean;
  onSend: (text: string, done: () => void) => void;
  onNote: (text: string, done: () => void) => void;
  onChooseTemplate: () => void;
  onExplain: (notice: ComposerNotice) => void;
}) {
  const { t } = useTranslation("whatsapp");
  const [noteMode, setNoteMode] = useState(false);
  const form = useForm<{ text: string }>({ resolver: zodResolver(schema), defaultValues: { text: "" } });
  const bar = (children: ReactNode) => <div data-slot="chat-composer" className={cn("flex shrink-0 items-center gap-2 border-t border-[var(--borde)] bg-[var(--lado-activo)]",
    phone ? "sticky bottom-0 z-10 px-2.5 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]" : "px-4 py-3")}>{children}</div>;

  if (state.kind === "readOnly") return bar(<span className="flex flex-1 items-center gap-2 text-[13px] text-[var(--t2)] max-md:text-[14px]">
    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[var(--punto-apagado)]" />{t("chats.composer.readOnly")}
    <InfoButton tone="inherit" label={t("chats.composer.whatItMeans")} onClick={() => onExplain("readOnly")} />
  </span>);

  const noteButton = <button type="button" aria-pressed={noteMode} aria-label={t("chats.composer.note")} title={t("chats.composer.note")} onClick={() => setNoteMode((value) => !value)}
    className={cn("inline-flex shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--foco)]",
      phone ? "size-11 rounded-full" : "size-10 rounded-[10px] border",
      noteMode ? "border-[color-mix(in_oklch,var(--punto-alerta)_60%,transparent)] bg-[var(--alerta-t)] text-[var(--alerta-tx)]" : "border-[var(--borde2)] bg-[var(--lado-activo)] text-[var(--t2)]")}>
    <StickyNote aria-hidden="true" className={phone ? "size-[22px]" : "size-[18px]"} />
  </button>;

  if (!noteMode && state.kind !== "open") {
    if (state.kind === "takenByOther") return bar(<>{noteButton}<span className="flex-1 text-[13px] text-[var(--t2)] max-md:text-[14px]">{t("chats.composer.takenBy", { name: state.name })}</span></>);
    if (state.kind === "paymentRequired") return bar(<>{noteButton}<span className="flex flex-1 items-center gap-2 text-[13px] text-[var(--peligro-tx)] max-md:text-[14px]">
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[var(--peligro)]" />{t("chats.composer.paymentMissing")}
      <InfoButton label={t("chats.composer.whatItMeans")} onClick={() => onExplain(state.reason === "template" ? "paymentTemplate" : "payment")} />
    </span></>);
    return bar(<>{noteButton}<span className={cn("flex min-w-0 flex-1 items-center gap-2 text-[var(--alerta-tx)]", phone ? "text-[14px] font-medium whitespace-nowrap" : "text-[13px]")}>
      <Clock aria-hidden="true" className="size-4 shrink-0" />{t("chats.composer.windowClosed")}
      <InfoButton tone="warning" label={t("chats.composer.whatItMeans")} onClick={() => onExplain("window")} />
    </span>
    <Button type="button" onClick={onChooseTemplate} className={phone ? "h-11 rounded-full px-[18px] text-[14.5px]" : undefined}>{t("chats.composer.chooseTemplate")}</Button></>);
  }

  const pending = noteMode ? notePending : sendPending;
  const submit = form.handleSubmit(({ text }) => {
    // Se limpia solo si el campo sigue con lo que se mandó: lo que se escribió mientras salía no se pierde.
    const draft = form.getValues("text");
    const done = () => { if (form.getValues("text") === draft) { form.reset({ text: "" }); setNoteMode(false); } };
    if (noteMode) onNote(text, done); else onSend(text, done);
  }, () => form.setFocus("text"));
  const label = noteMode ? t("chats.composer.saveNote") : t("chats.composer.send");
  const pendingLabel = noteMode ? t("chats.composer.savingNote") : t("chats.composer.sending");
  const placeholder = noteMode ? t(phone ? "chats.composer.notePlaceholderPhone" : "chats.composer.notePlaceholder")
    : t(phone ? "chats.composer.messagePlaceholderPhone" : "chats.composer.messagePlaceholder");

  return <form onSubmit={(event) => { void submit(event); }} className="contents">{bar(<>
    {noteButton}
    <Textarea {...form.register("text")} rows={1} maxLength={maxLength} aria-label={noteMode ? t("chats.composer.note") : t("chats.composer.message")} placeholder={placeholder}
      onKeyDown={(event) => {
        // Como en WhatsApp: Enter manda y Mayúsculas + Enter baja de renglón.
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); }
      }}
      className={cn("max-h-32 min-h-10 flex-1 py-2.5 leading-[1.3]",
        phone ? "max-md:min-h-11 max-md:rounded-[22px] max-md:px-4 max-md:py-[11px] max-md:text-[15px]" : "h-10",
        noteMode ? "border-[color-mix(in_oklch,var(--punto-alerta)_60%,transparent)] bg-[var(--alerta-t)]" : null)} />
    {phone
      ? <Button type="submit" size="icon" aria-label={label} title={label} pending={pending} pendingLabel={<span className="sr-only">{pendingLabel}</span>}
        className={cn("size-11 rounded-full", noteMode ? "bg-[var(--punto-alerta)] bg-none" : null)}>
        {noteMode ? <Check aria-hidden="true" className="size-5" /> : <Send aria-hidden="true" className="size-5" />}
      </Button>
      : <Button type="submit" pending={pending} pendingLabel={pendingLabel}>{label}</Button>}
  </>)}</form>;
}
