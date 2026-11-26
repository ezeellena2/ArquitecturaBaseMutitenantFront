import { Fragment, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CircleAlert } from "lucide-react";
import type { AssistantMessageResponse } from "@/modules/assistant/api/types";
import type { AssistantProposalResponse } from "@/shared/api/types";
import {
  assistantActionKey, assistantActions, assistantProposalQueryKey, useAssistantActionAdapter, useAssistantProposalQuery, withAssistantProposal,
  type AssistantActionAdapter, type AssistantActionContract,
} from "@/shared/assistant-actions";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { Button } from "@/shared/ui/button";

type MessageProposal = NonNullable<AssistantMessageResponse["proposal"]>;

// Las dudas («Revisá») que tienen texto publicado; una clave desconocida deja solo la marca, nunca la clave a la vista.
const doubtTexts: Readonly<Record<string, string>> = {
  "Assistant.Action.Doubt.Similar": "actionCard.doubts.similar",
};

interface CardItem {
  readonly text: string;
  readonly doubt?: string;
}

interface CardRow {
  readonly key: string;
  readonly label: string;
  readonly items: readonly CardItem[];
}

const isOperation = (value: unknown, op: "add" | "remove") => typeof value === "object" && value !== null && (value as { op?: unknown }).op === op;

/** Cada dato propuesto con su nombre leído del servidor, en el orden de los campos de la acción; nunca un id. */
function cardRows(contract: AssistantActionContract, proposal: AssistantProposalResponse, t: TFunction<"assistant">): CardRow[] {
  const texts = `actionCard.actions.${contract.id}`;
  const rows: CardRow[] = proposal.target ? [{ key: "target", label: t(`${texts}.target`), items: [{ text: proposal.target.label }] }] : [];
  for (const field of contract.fields) {
    const entries = proposal.values.filter((entry) => entry.field === field.name);
    const item = (entry: (typeof entries)[number]): CardItem[] => {
      const text = entry.label ?? (typeof entry.value === "string" ? entry.value : "");
      return text.trim() === "" ? [] : [{ text, doubt: entry.doubt ?? undefined }];
    };
    if (field.type !== "choices") {
      const items = entries.flatMap(item);
      if (items.length) rows.push({ key: field.name, label: t(`${texts}.fields.${field.name}`), items });
      continue;
    }
    // Editar suma y quita sobre lo de ahora, así que cada lista va en dos renglones: lo que se suma y lo que se quita.
    for (const op of contract.kind === "edit" ? (["add", "remove"] as const) : (["add"] as const)) {
      const items = entries.filter((entry) => isOperation(entry.value, op)).flatMap(item);
      const label = contract.kind === "edit" ? `${field.name}${op === "add" ? "Added" : "Removed"}` : field.name;
      if (items.length) rows.push({ key: `${field.name}:${op}`, label: t(`${texts}.fields.${label}`), items });
    }
  }
  return rows;
}

/** Lo que nombra la tarjeta plegada: el destino, o el primer texto propuesto (el correo de la invitación, el nombre del rol). */
function cardSubject(contract: AssistantActionContract, proposal: AssistantProposalResponse): string | undefined {
  if (proposal.target) return proposal.target.label;
  for (const field of contract.fields) {
    if (field.type !== "text" && field.type !== "email") continue;
    const value = proposal.values.find((entry) => entry.field === field.name)?.value;
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return undefined;
}

function unavailableText(contract: AssistantActionContract, reason: AssistantProposalResponse["unavailableReason"], t: TFunction<"assistant">) {
  const texts = `actionCard.actions.${contract.id}`;
  switch (reason) {
    case "permission": return t(`${texts}.noPermission`);
    case "target": return t(`${texts}.noTarget`);
    case "module":
    case "version":
    case "subject": return t(`actionCard.reasons.${reason}`);
    default: return undefined;
  }
}

const linkClass = "rounded-[0.25rem] font-semibold whitespace-nowrap text-[var(--marca-tx)] outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)]";

function FoldedCard({ name, subject, tag, reason, link }: { name: string; subject?: string; tag: string; reason?: string; link?: { to: string; text: string } }) {
  return <div role="group" aria-label={name} className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-[0.625rem] border border-[var(--borde2)] bg-[var(--superficie)] px-3 py-2 text-[0.8125rem] max-md:py-2.5 max-md:text-[0.875rem]">
    <span className="font-semibold text-[var(--t1)]">{name}</span>
    {subject ? <span className="min-w-0 [overflow-wrap:anywhere] text-[var(--t1)]">{subject}</span> : null}
    <span className="whitespace-nowrap rounded-[0.1875rem] border border-[var(--borde2)] px-1.5 text-[0.71875rem] text-[var(--t2)]">{tag}</span>
    {reason ? <span className="text-[var(--t2)]">{reason}</span> : null}
    {link ? <Link className={linkClass} to={link.to}>{link.text}</Link> : null}
  </div>;
}

function OpenButton({ adapter, contract, proposal, label, phone }: { adapter: AssistantActionAdapter; contract: AssistantActionContract; proposal: AssistantProposalResponse; label: string; phone: boolean }) {
  const location = useLocation();
  // El diálogo abre donde está la tarjeta, sobre el Inicio; una página, en su lugar (ADR 0068 §9).
  const to = adapter.Dialog ? withAssistantProposal(`${location.pathname}${location.search}`, proposal.id) : adapter.href(proposal);
  return <Button asChild variant={contract.kind === "remove" ? "danger" : "default"} size={phone ? "lg" : "sm"} className={phone ? "w-full" : "h-7"}>
    <Link to={to}>{label}</Link>
  </Button>;
}

/**
 * La tarjeta de una propuesta del asistente en el hilo, después del texto de la IA (Asistente-Org-Acciones). Lee la
 * propuesta del servidor (el estado y los nombres de ahora) y muestra sus seis estados: nueva, con «Revisá», reemplazada,
 * ya no disponible, aplicada y sin confirmar. El botón abre la pantalla de la acción con `?proposal=<id>`.
 */
export function AssistantActionCard({ proposal: summary }: { proposal: MessageProposal }) {
  const { t } = useTranslation("assistant");
  const phone = useMediaQuery("(max-width: 767px)");
  const client = useQueryClient();
  const query = useAssistantProposalQuery(summary.id);
  const adapter = useAssistantActionAdapter(summary.action, summary.version);
  const contract = assistantActions.find((candidate) => assistantActionKey(candidate.id, candidate.version) === assistantActionKey(summary.action, summary.version));

  // El mensaje trae el estado nuevo (otra propuesta la reemplazó, otra pestaña la guardó): se vuelve a leer la propuesta.
  const seenState = useRef(summary.state);
  useEffect(() => {
    if (seenState.current === summary.state) return;
    seenState.current = summary.state;
    void client.invalidateQueries({ queryKey: assistantProposalQueryKey(summary.id) });
  }, [client, summary.id, summary.state]);

  const proposal = query.data;
  // Una acción que este front no conoce (otra versión del contrato) no tiene con qué nombrarse.
  if (!contract || !proposal || proposal.kind !== "action") return null;
  const texts = `actionCard.actions.${contract.id}`;
  const name = t(`${texts}.name`);
  const subject = cardSubject(contract, proposal);

  switch (proposal.state) {
    case "replaced":
      return <FoldedCard name={name} subject={subject} tag={t("actionCard.replaced")} />;
    case "unavailable":
      return <FoldedCard name={name} subject={subject} tag={t("actionCard.unavailable")} reason={unavailableText(contract, proposal.unavailableReason, t)} />;
    case "applied": {
      const to = adapter?.appliedHref?.(proposal);
      return <FoldedCard name={name} subject={subject} tag={t(`${texts}.applied`)} link={to ? { to, text: t(`${texts}.appliedLink`) } : undefined} />;
    }
    case "unconfirmed":
      return <FoldedCard name={name} subject={subject} tag={t("actionCard.unconfirmed")}
        link={adapter?.reviewHref ? { to: adapter.reviewHref, text: t(`${texts}.reviewLink`) } : undefined} />;
    case "new":
      break;
    default:
      return null;
  }

  const rows = cardRows(contract, proposal, t);
  const button = adapter ? <OpenButton adapter={adapter} contract={contract} proposal={proposal} label={t(`${texts}.open`)} phone={phone} /> : null;
  return <div role="group" aria-label={name} className="mt-1.5 overflow-hidden rounded-[0.625rem] border border-[var(--borde2)] bg-[var(--superficie)] text-[0.8125rem] max-md:text-[0.875rem]">
    <div className="flex items-center gap-2 border-b border-[var(--borde)] bg-[var(--s2)] px-2.5 py-1.75 max-md:px-3 max-md:py-2.5">
      <span className="mr-auto font-semibold text-[var(--t1)]">{name}</span>
      {phone ? null : button}
    </div>
    <dl className="grid grid-cols-[11.875rem_minmax(0,1fr)] gap-x-3.5 gap-y-1.5 px-3 pt-2.5 pb-3 max-md:grid-cols-[7rem_minmax(0,1fr)]">
      {rows.map((row) => {
        const reasons = [...new Set(row.items.flatMap((item) => (item.doubt && doubtTexts[item.doubt] ? [t(doubtTexts[item.doubt])] : [])))];
        return <Fragment key={row.key}>
          <div className="contents">
            <dt className="text-[var(--t2)]">{row.label}</dt>
            <dd className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 [overflow-wrap:anywhere] text-[var(--t1)]">
              {row.items.map((item, index) => <span key={index} className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{item.text}{index < row.items.length - 1 ? "," : null}</span>
                {item.doubt ? <span className="inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-[0.1875rem] bg-[var(--alerta-t)] px-1.5 text-[0.71875rem] font-semibold text-[var(--alerta-tx)]">
                  <CircleAlert className="size-3" aria-hidden="true" />{t("actionCard.review")}
                </span> : null}
              </span>)}
            </dd>
          </div>
          {reasons.map((reason) => <div key={reason} className="contents">
            <dt className="text-[var(--t2)]">{t("actionCard.reason")}</dt>
            <dd className="min-w-0 [overflow-wrap:anywhere] text-[var(--t1)]">{reason}</dd>
          </div>)}
        </Fragment>;
      })}
    </dl>
    {phone && button ? <div className="px-3 pb-3">{button}</div> : null}
  </div>;
}
