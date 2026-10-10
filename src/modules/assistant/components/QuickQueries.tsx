import { useTranslation } from "react-i18next";
import type { AssistantStateResponse } from "@/shared/api/types";
import type { AssistantScope } from "../api/assistant";

const keys = {
  business: ["active_users", "expired_invitations", "owners", "recent_changes"],
  platform: ["pending_organizations", "pending_recoveries", "today_security", "assistant_usage"],
  consumer: ["my_organizations", "my_signin", "my_messages"],
} as const;

export function QuickQueries({ scope, queries, disabled, onSelect }: {
  scope: AssistantScope; queries: AssistantStateResponse["quickQueries"]; disabled: boolean; onSelect: (key: string) => void;
}) {
  const { t } = useTranslation("assistant");
  return <div className="flex flex-wrap justify-center gap-2">
    {queries.filter(({ key }) => (keys[scope.access] as readonly string[]).includes(key)).map(({ key }) =>
      <button key={key} type="button" disabled={disabled} onClick={() => onSelect(key)}
        className="min-h-[34px] rounded-full border border-[var(--borde)] bg-[var(--lado-activo)] px-3.5 text-[13.5px] text-[var(--t1)] hover:border-[var(--marca)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] max-md:min-h-11 disabled:opacity-50">
        {t(`quick.${key}`)}
      </button>)}
  </div>;
}
