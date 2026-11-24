import { FileText, Image as ImageIcon, MapPin, Mic, Paperclip, Sticker, Video, type LucideIcon } from "lucide-react";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { InfoTip } from "@/shared/ui/InfoTip";
import { StatusDot } from "@/shared/ui/StatusDot";
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
export function MessageThread({ messages, perspective, label, phone, hasEarlier, loadingEarlier, onLoadEarlier, review }: {
  messages: readonly WhatsAppChatMessageResponse[];
  perspective: ThreadPerspective;
  label: string;
  phone: boolean;
  hasEarlier: boolean;
  loadingEarlier: boolean;
  onLoadEarlier: () => void;
  /** «Marcar como revisado» de un mensaje «Sin confirmar» (0066): lo ofrece quien atiende el chat. */
  review?: MessageReview;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const end = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;
  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [lastId]);
  if (format.isLoading) return <div className={threadClass(phone)} />;


  return <div role="log" aria-label={label} className={threadClass(phone)}>
    {hasEarlier ? <div className="flex justify-center">
      <Button type="button" variant="outline" size="sm" disabled={loadingEarlier} onClick={onLoadEarlier}>{t("chats.thread.loadEarlier")}</Button>
    </div> : null}
    {messages.map((message, index) => {
      const previous = messages[index - 1];
      const separator = !previous || format.formatDate(previous.createdAtUtc) !== format.formatDate(message.createdAtUtc)
        ? <span className={cn("self-center rounded-full border border-[var(--borde)] bg-[var(--superficie)] px-2.5 py-0.5 text-[0.75rem]", phone ? "rounded-[0.5rem] border-0 text-[var(--t2)]" : "text-[var(--t3)]")}>
          {chatDay(format, message.createdAtUtc)}
        </span> : null;
      return <Fragment key={message.id}>{separator}<ThreadItem message={message} perspective={perspective} phone={phone} review={review} /></Fragment>;
    })}
    <div ref={end} />
  </div>;
}

const threadClass = (phone: boolean) => cn("flex flex-col bg-[var(--s2)]", phone
  ? "flex-1 gap-2 p-3"
  : "min-h-0 flex-1 gap-2.5 overflow-y-auto px-6 py-4");

/** Marcar como revisado un mensaje «Sin confirmar»: qué hacer y cuál se está marcando. */
export interface MessageReview {
  onReview: (message: WhatsAppChatMessageResponse) => void;
  pendingId: string | null;
}

function ThreadItem({ message, perspective, phone, review }: {
  message: WhatsAppChatMessageResponse;
  perspective: ThreadPerspective;
  phone: boolean;
  review?: MessageReview;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const time = format.formatTime(message.createdAtUtc);

  if (message.kind === "Event") return <span className={cn("self-center text-center text-[var(--t3)]", phone ? "text-[0.78125rem]" : "text-[0.75rem]")}>{message.text}</span>;

  if (message.kind === "Note") return <div className={cn("flex flex-col gap-0.5 self-center border border-[color-mix(in_oklch,var(--punto-alerta)_45%,transparent)] bg-[var(--alerta-t)] px-3 py-2 leading-[1.45] text-[var(--alerta-tx)]",
    phone ? "max-w-[88%] rounded-[0.75rem] text-[0.875rem]" : "max-w-[70%] rounded-[0.625rem] text-[0.8125rem]")}>
    <span className={cn("font-semibold", phone ? "text-[0.75rem]" : "text-[0.71875rem]")}>{[t("chats.thread.note"), message.author, time].filter(Boolean).join(" · ")}</span>
    <span className="whitespace-pre-wrap">{message.text}</span>
  </div>;

  // Del lado de quien mira: el equipo manda lo saliente; la persona, lo entrante (lo que ella le escribió a la organización).
  // Un saliente sin autor es del bot (CC15).
  const own = perspective.kind === "team" ? message.direction === "Outbound" : message.direction === "Inbound";
  const sender = perspective.kind === "person"
    ? own ? null : perspective.organizationName
    : own ? message.author ?? t("chats.thread.automaticReply") : null;
  const failed = message.status === "Failed";
  // «Sin confirmar» (WA-Chats-Base2 y Plat-WA-Chats-Base2, 0066): lo que salió sin que WhatsApp confirmara el envío lo ve el
  // equipo que atiende, con su (i) y «Marcar como revisado»; revisado, quién y cuándo en gris. Revisar no lo reenvía.
  const uncertain = message.status === "Uncertain" && perspective.kind === "team";
  // «No se pudo mandar» lleva debajo su motivo, en su propio renglón (WA-Chats-Base2, 0066 §3): el texto que manda el back
  // para uno de los ocho códigos, tal como llega.
  const footer: ReactNode = failed
    ? t("chats.thread.failed")
    : [message.status === "Pending" ? t("chats.thread.pending") : sender, time].filter(Boolean).join(" · ");
  const MediaIcon = message.kind === "Media" ? mediaIcons[message.mediaKind ?? "Other"] : null;

  return <div className={cn("flex flex-col gap-0.75", phone ? "max-w-[80%] gap-0.5" : "max-w-[62%]", own ? "items-end self-end" : "self-start")}>
    <span className={cn("px-3 py-2 whitespace-pre-wrap [overflow-wrap:anywhere]",
      phone ? "rounded-[0.875rem] text-[0.9375rem] leading-[1.4]" : "rounded-[0.75rem] text-[0.84375rem] leading-[1.45]",
      own ? "rounded-tr-[0.25rem] bg-[var(--marca-t)] text-[var(--sugerencia-tx)]"
        : cn("rounded-tl-[0.25rem] bg-[var(--superficie)]", phone ? "" : "border border-[var(--borde)]"),
      MediaIcon ? "inline-flex items-center gap-2 text-[var(--t2)] italic" : null)}>
      {MediaIcon ? <><MediaIcon aria-hidden="true" className="size-4 shrink-0 text-[var(--t3)]" />{t(`chats.thread.media.${message.mediaKind ?? "Other"}`)}</> : message.text}
    </span>
    {uncertain ? <UncertainFooter message={message} review={review} /> : <>
      <span className={cn("px-1 text-[0.71875rem]", failed ? "text-[var(--peligro)]" : "text-[var(--t3)]")}>{footer}</span>
      {failed && message.failureReason ? <span className="px-1 text-[0.71875rem] text-[var(--peligro)]">{message.failureReason}</span> : null}
    </>}
  </div>;
}

/// Debajo de un mensaje «Sin confirmar»: el estado en ámbar con su (i) y, en su renglón, «Marcar como revisado»; revisado,
/// sin la (i) y con «Lo revisó Ana Gómez · 19/11/2026, 14:35».
function UncertainFooter({ message, review }: { message: WhatsAppChatMessageResponse; review?: MessageReview }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const label = t("chats.thread.uncertain");
  const reviewedAt = message.reviewedAtUtc;
  const reviewed = reviewedAt
    ? message.reviewedByName
      ? t("chats.thread.reviewedBy", { name: message.reviewedByName, when: format.formatDateTime(reviewedAt) })
      : t("chats.thread.reviewed", { when: format.formatDateTime(reviewedAt) })
    : null;
  return <>
    <span className="inline-flex items-center gap-1 px-1 text-[0.71875rem] text-[var(--t3)]">
      <StatusDot tone="warning" label={label} className="text-[0.71875rem] text-inherit" />
      {reviewed ? null : <InfoTip text={t("chats.thread.uncertainInfo")} title={label} />}
    </span>
    {reviewed ? <span className="px-1 text-[0.71875rem] text-[var(--t3)]">{reviewed}</span>
      : review ? <span className="px-1 text-[0.71875rem]">
        <button type="button" disabled={review.pendingId === message.id} onClick={() => review.onReview(message)}
          className="cursor-pointer font-semibold text-[var(--marca-tx)] underline outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] disabled:cursor-default disabled:opacity-60">
          {t("chats.thread.markReviewed")}
        </button>
      </span> : null}
  </>;
}
