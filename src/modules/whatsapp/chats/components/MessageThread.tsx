import { FileText, Image as ImageIcon, MapPin, Mic, Paperclip, Sticker, Video, type LucideIcon } from "lucide-react";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import type { WhatsAppChatMessageResponse, WhatsAppMediaKind } from "../../api/types";
import { chatDay } from "../lib/conversation";

const mediaIcons: Record<NonNullable<WhatsAppMediaKind>, LucideIcon> = {
  Image: ImageIcon, Audio: Mic, Video, Document: FileText, Sticker, Location: MapPin, Other: Paperclip,
};

/**
 * Desde dónde se lee el hilo: el equipo (Chats y Consultas) ve a la izquierda lo que llega y a la derecha lo que manda;
 * la persona (Mensajes) ve a la derecha lo suyo y a la izquierda lo de la organización, con su nombre.
 */
export type ThreadPerspective = { kind: "team" } | { kind: "person"; organizationName: string };

/// El hilo de una conversación (WA-Chats .w-msjs y M-WA-Conversacion .ap-chat): los días separados, los globos de cada
/// lado con la hora (y quién mandó lo del equipo), las notas internas en amarillo, los eventos al centro y los archivos
/// como «Mandó una foto» (D7: sin descarga hasta la E14). Los mensajes llegan en orden y se baja al último.
export function MessageThread({ messages, perspective, label, phone, hasEarlier, loadingEarlier, onLoadEarlier }: {
  messages: readonly WhatsAppChatMessageResponse[];
  perspective: ThreadPerspective;
  label: string;
  phone: boolean;
  hasEarlier: boolean;
  loadingEarlier: boolean;
  onLoadEarlier: () => void;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const end = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;
  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [lastId]);
  if (format.isLoading) return <div className={threadClass(phone)} />;

  const calendarWords = { today: t("format:calendar.today"), yesterday: t("format:calendar.yesterday") };
  const dayLabels = { today: t("chats.day.today"), yesterday: t("chats.day.yesterday") };

  return <div role="log" aria-label={label} className={threadClass(phone)}>
    {hasEarlier ? <div className="flex justify-center">
      <Button type="button" variant="outline" size="sm" disabled={loadingEarlier} onClick={onLoadEarlier}>{t("chats.thread.loadEarlier")}</Button>
    </div> : null}
    {messages.map((message, index) => {
      const previous = messages[index - 1];
      const separator = !previous || format.formatDate(previous.createdAtUtc) !== format.formatDate(message.createdAtUtc)
        ? <span className={cn("self-center rounded-full border border-[var(--borde)] bg-[var(--lado-activo)] px-2.5 py-0.5 text-[12px]", phone ? "rounded-[8px] border-0 text-[var(--t2)] shadow-[var(--sombra-flecha)]" : "text-[var(--t3)]")}>
          {chatDay(format, message.createdAtUtc, calendarWords, dayLabels)}
        </span> : null;
      return <Fragment key={message.id}>{separator}<ThreadItem message={message} perspective={perspective} phone={phone} /></Fragment>;
    })}
    <div ref={end} />
  </div>;
}

const threadClass = (phone: boolean) => cn("flex flex-col bg-[var(--s2)]", phone
  ? "flex-1 gap-2 p-3"
  : "min-h-0 flex-1 gap-2.5 overflow-y-auto px-6 py-4");

function ThreadItem({ message, perspective, phone }: { message: WhatsAppChatMessageResponse; perspective: ThreadPerspective; phone: boolean }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const time = format.formatTime(message.createdAtUtc);

  if (message.kind === "Event") return <span className={cn("self-center text-center text-[var(--t3)]", phone ? "text-[12.5px]" : "text-[12px]")}>{message.text}</span>;

  if (message.kind === "Note") return <div className={cn("flex flex-col gap-0.5 self-center border border-[color-mix(in_oklch,var(--punto-alerta)_45%,transparent)] bg-[var(--alerta-t)] px-3 py-2 leading-[1.45] text-[var(--alerta-tx)]",
    phone ? "max-w-[88%] rounded-[12px] text-[14px]" : "max-w-[70%] rounded-[10px] text-[13px]")}>
    <span className={cn("font-semibold", phone ? "text-[12px]" : "text-[11.5px]")}>{[t("chats.thread.note"), message.author, time].filter(Boolean).join(" · ")}</span>
    <span className="whitespace-pre-wrap">{message.text}</span>
  </div>;

  // Del lado de quien mira: el equipo manda lo saliente; la persona, lo entrante (lo que ella le escribió a la organización).
  // Un saliente sin autor es del bot (CC15).
  const own = perspective.kind === "team" ? message.direction === "Outbound" : message.direction === "Inbound";
  const sender = perspective.kind === "person"
    ? own ? null : perspective.organizationName
    : own ? message.author ?? t("chats.thread.automaticReply") : null;
  const failed = message.status === "Failed";
  const footer: ReactNode = failed
    ? [t("chats.thread.failed"), message.failureReason].filter(Boolean).join(" · ")
    : [message.status === "Pending" ? t("chats.thread.pending") : sender, time].filter(Boolean).join(" · ");
  const MediaIcon = message.kind === "Media" ? mediaIcons[message.mediaKind ?? "Other"] : null;

  return <div className={cn("flex flex-col gap-[3px]", phone ? "max-w-[80%] gap-0.5" : "max-w-[62%]", own ? "items-end self-end" : "self-start")}>
    <span className={cn("px-3 py-2 whitespace-pre-wrap [overflow-wrap:anywhere]",
      phone ? "rounded-[14px] text-[15px] leading-[1.4]" : "rounded-[12px] text-[13.5px] leading-[1.45]",
      own ? "rounded-tr-[4px] bg-[var(--marca-t)] text-[var(--sugerencia-tx)]"
        : cn("rounded-tl-[4px] bg-[var(--lado-activo)]", phone ? "shadow-[var(--sombra-flecha)]" : "border border-[var(--borde)]"),
      MediaIcon ? "inline-flex items-center gap-2 text-[var(--t2)] italic" : null)}>
      {MediaIcon ? <><MediaIcon aria-hidden="true" className="size-4 shrink-0 text-[var(--t3)]" />{t(`chats.thread.media.${message.mediaKind ?? "Other"}`)}</> : message.text}
    </span>
    <span className={cn("px-1 text-[11.5px]", failed ? "text-[var(--peligro)]" : "text-[var(--t3)]")}>{footer}</span>
  </div>;
}
