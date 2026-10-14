import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import type { PlatformWhatsAppBotResponse } from "../../api/types";
import { botTeamsQueryKey, fetchBotTeams, fetchPlatformBot, platformBotQueryKey, updatePlatformBot } from "../api/bot";
import { BotScreen } from "../components/BotScreen";
import { platformBotRequest, type BotPatch } from "../lib/botModel";

/// Plataforma › Administración › WhatsApp › Bot (Plat-WA-Bot, Plat-WA-Bot-Recorrido y M-Plat-WA-Bot): el bot del número
/// de la plataforma, sin «Además». La opción del sistema («Entrar a mi cuenta») se ve pero no se edita.
export function PlatformBotPage() {
  const { t } = useTranslation("whatsapp");
  const queryClient = useQueryClient();
  const bot = useQuery({ queryKey: platformBotQueryKey, queryFn: ({ signal }) => fetchPlatformBot(signal), meta: { silent: true, blocksView: true } });
  const teams = useQuery({ queryKey: botTeamsQueryKey("platform"), queryFn: ({ signal }) => fetchBotTeams("platform", signal), meta: { silent: true } });
  if (!bot.data && bot.isError) return <LoadErrorPage screen={t("bot.title")} onRetry={() => { void bot.refetch(); }} />;

  async function save(patch: BotPatch): Promise<PlatformWhatsAppBotResponse> {
    if (!bot.data) throw new Error("No hay un bot para guardar.");
    const result = await updatePlatformBot(platformBotRequest(bot.data, patch));
    queryClient.setQueryData(platformBotQueryKey, result);
    return result;
  }

  return <BotScreen variant="platform" bot={bot.data} teams={teams.data?.items ?? []} onSave={save} />;
}
