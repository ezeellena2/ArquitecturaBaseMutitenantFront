import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import type { ModuleContentProps } from "@/shared/modules/types";
import { Page } from "@/shared/ui/Page";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { assistantSettingsKey, fetchPlatformAssistantSettings } from "../api/settings";
import { AssistantSettingsEditor } from "./AssistantSettingsEditor";

export function PlatformAssistantSettingsPage({ me }: ModuleContentProps) {
  const { t } = useTranslation("assistant");
  const scope = { access: me.access, tenantId: me.activeTenantId ?? null, userId: me.id };
  const query = useQuery({ queryKey: assistantSettingsKey(scope), queryFn: ({ signal }) => fetchPlatformAssistantSettings(signal), meta: { silent: true, blocksView: true } });
  if (!query.data && query.isError) return <LoadErrorPage onRetry={() => { void query.refetch(); }} />;
  if (!query.data) return <Page icon={Sparkles} title={t("settings.title")}><p role="status">{t("loading")}</p></Page>;
  return <AssistantSettingsEditor key={me.id} me={me} settings={query.data} loadError={query.error}
    reload={async () => { const result = await query.refetch(); return result.isSuccess ? result.data : undefined; }} />;
}
