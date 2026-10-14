import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useFilters } from "@/shared/hooks/useFilters";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import type { WhatsAppBotResponse } from "../../api/types";
import { botNumbersQueryKey, botTeamsQueryKey, fetchBotNumbers, fetchBotTeams, fetchNumberBot, numberBotQueryKey, updateNumberBot } from "../api/bot";
import { BotScreen } from "../components/BotScreen";
import { NumberPicker } from "../components/NumberPicker";
import { numberBotRequest, type BotPatch } from "../lib/botModel";

const numberKeys = ["numero"] as const;

/// Administración › WhatsApp › Bot de la organización (WA-Respuestas, WA-Admin-Editar, WA-Bot-Recorrido y sus M-*): un
/// bot por número; con varios, se elige cuál (`?numero=<id>`). Un número desconectado no atiende, así que no se elige.
export function BotPage() {
  const { t } = useTranslation("whatsapp");
  const queryClient = useQueryClient();
  const filters = useFilters(numberKeys);
  const numbers = useQuery({ queryKey: botNumbersQueryKey, queryFn: ({ signal }) => fetchBotNumbers(signal), meta: { silent: true, blocksView: true } });
  const teams = useQuery({ queryKey: botTeamsQueryKey("organization"), queryFn: ({ signal }) => fetchBotTeams("organization", signal), meta: { silent: true } });
  const choices = (numbers.data?.numbers.items ?? []).filter((number) => number.status !== "Disconnected");
  const selected = choices.find((number) => number.id === filters.values.numero) ?? choices[0] ?? null;
  const bot = useQuery({ queryKey: numberBotQueryKey(selected?.id ?? ""), queryFn: ({ signal }) => fetchNumberBot(selected?.id ?? "", signal),
    enabled: selected !== null, meta: { silent: true, blocksView: true } });

  if (!numbers.data && numbers.isError) return <LoadErrorPage screen={t("bot.title")} onRetry={() => { void numbers.refetch(); }} />;
  if (!bot.data && bot.isError) return <LoadErrorPage screen={t("bot.title")} onRetry={() => { void bot.refetch(); }} />;

  // El PUT lleva todo el bot con el cambio encima y la versión leída; la respuesta pasa a ser lo leído.
  async function save(patch: BotPatch): Promise<WhatsAppBotResponse> {
    if (!selected || !bot.data) throw new Error("No hay un bot para guardar.");
    const result = await updateNumberBot(selected.id, numberBotRequest(bot.data, patch));
    queryClient.setQueryData(numberBotQueryKey(selected.id), result);
    return result;
  }

  return <BotScreen variant="organization" bot={selected ? bot.data : undefined} teams={teams.data?.items ?? []} onSave={save}
    empty={numbers.data && !selected ? t("bot.noNumbers") : undefined}
    picker={selected ? <NumberPicker numbers={choices} selected={selected} onSelect={(id) => filters.setFilter("numero", id)} /> : undefined} />;
}
