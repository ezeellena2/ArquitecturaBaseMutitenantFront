import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useFilters } from "@/shared/hooks/useFilters";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { EmptyState } from "@/shared/ui/EmptyState";
import { WhatsAppIcon } from "@/shared/ui/icons";
import { Page } from "@/shared/ui/Page";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Surface } from "@/shared/ui/Surface";
import type { WhatsAppTeamResponse } from "../../api/types";
import type { BotData, BotPatch } from "../lib/botModel";
import { BotConfiguration } from "./BotConfiguration";
import { BotFlow } from "./BotFlow";

const viewKeys = ["vista"] as const;

/// La pantalla del bot (WA-Respuestas, WA-Bot-Recorrido, Plat-WA-Bot y sus M-*): «Configuración | Recorrido» con el
/// segmentado arriba, en la compu y en el teléfono (F8); en la organización, además, el número elegido. La vista queda
/// en la dirección (`?vista=recorrido`).
export function BotScreen({ variant, bot, teams, picker, empty, onSave }: {
  variant: "organization" | "platform";
  bot: BotData | undefined;
  teams: readonly WhatsAppTeamResponse[];
  /** El número cuyo bot se ve (solo la organización). */
  picker?: ReactNode;
  /** Sin nada que configurar (una organización sin números). */
  empty?: string;
  onSave: (patch: BotPatch) => Promise<unknown>;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const filters = useFilters(viewKeys);
  const flow = filters.values.vista === "recorrido";
  const views = <div className={phone ? "mx-4 mt-1 mb-2" : undefined}>
    <SegmentedControl aria-label={t("whatsapp:bot.views")} options={[
      { key: "settings", label: t("whatsapp:bot.configuration"), pressed: !flow, onSelect: () => filters.setFilter("vista", undefined) },
      { key: "flow", label: t("whatsapp:bot.flow.title"), pressed: flow, onSelect: () => filters.setFilter("vista", "recorrido") },
    ]} />
  </div>;
  const summary = bot ? t("whatsapp:bot.summary", { count: bot.menu.length, value: format.formatInteger(bot.menu.length) }) : undefined;
  const content = empty ? <Surface phoneFlush><EmptyState framed={false} title={empty} /></Surface>
    : !bot ? <p role="status" className="text-[13px] text-[var(--t2)] max-md:px-5">{t("common:states.loading")}</p>
      : flow ? <BotFlow bot={bot} variant={variant} teams={teams} />
        : <BotConfiguration bot={bot} variant={variant} teams={teams} onSave={onSave} />;

  return <Page icon={WhatsAppIcon} title={t("whatsapp:bot.title")} summary={summary} phoneBody="gray">
    {/* WA-Respuestas: el segmentado arriba y, debajo, la caja del número; en el teléfono, el número va primero. */}
    {phone ? <>{picker}{empty ? null : views}{content}</> : <>{empty ? null : views}{picker}{content}</>}
  </Page>;
}
