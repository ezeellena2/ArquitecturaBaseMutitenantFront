import { useTranslation } from "react-i18next";
import type { AssistantTurnState } from "../runtime/assistantTurnState";
import { CheckIcon } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/Spinner";

// Catálogo publicado de Assistant.resx; nunca traducir claves arbitrarias del modelo.
const publishedLabels = new Set([
  "Tool.org_users",
  "Tool.org_find_person",
  "Tool.org_role_members",
  "Tool.org_companies",
  "Tool.org_company_members",
  "Tool.org_invitations",
  "Tool.org_audit",
  "Tool.org_pending",
  "Tool.platform_organizations",
  "Tool.platform_find_organization",
  "Tool.platform_accounts",
  "Tool.platform_recoveries",
  "Tool.platform_security",
  "Tool.org_roles",
  "Tool.platform_assistant_usage",
  "Tool.my_account",
  "Tool.my_organizations",
  "Tool.my_interactions",
  "Tool.help_article",
]);

export function ToolStatus({ turn, pending }: { turn: AssistantTurnState | null; pending: boolean }) {
  const { t } = useTranslation("assistant");
  const tools = turn?.tools ?? [];
  const rows: { key: string; state: "running" | "complete" | "failed"; label: string }[] = [];
  for (let index = 0; index < tools.length; index++) {
    const tool = tools[index];
    const next = tools[index + 1];
    if (tool.labelKey === "Tool.org_companies" && next?.labelKey === "Tool.org_users" && tool.state === "complete" && next.state === "complete") {
      rows.push({ key: tool.toolKey, state: "complete", label: t("tools.companiesAndUsers") });
      index++;
      continue;
    }
    const state = tool.state === "complete" || tool.state === "failed" ? tool.state : "running";
    const known = publishedLabels.has(tool.labelKey) && ["running", "complete", "failed"].includes(tool.state);
    rows.push({ key: tool.toolKey, state, label: t(known ? `tools.labels.${tool.labelKey.slice(5)}.${state}` : `tools.${state}`) });
  }
  return <div className="flex flex-col gap-1 text-[13px] text-[var(--t2)]">
    {rows.map((row) => <p key={row.key} role="status" className="inline-flex items-center gap-2">
      {row.state === "complete" ? <CheckIcon className="size-3.5 text-[var(--ok)]" /> : row.state === "running" ? <Spinner decorative className="inline-flex shrink-0 [&>span]:size-3 [&>span]:border-[var(--borde2)] [&>span]:border-t-[var(--marca)]" /> : null}
      {row.label}
    </p>)}
    {pending && rows.length === 0 ? <p role="status">{t(turn?.phase === "writing" ? "status.writing" : "status.consulting")}</p> : null}
  </div>;
}
