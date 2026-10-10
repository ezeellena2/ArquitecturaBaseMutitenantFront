import { useTranslation } from "react-i18next";
import type { AssistantTurnState } from "../runtime/assistantTurnState";
import { CheckIcon } from "@/shared/ui/icons";

export function ToolStatus({ turn, pending }: { turn: AssistantTurnState | null; pending: boolean }) {
  const { t } = useTranslation("assistant");
  return <div className="flex flex-col gap-1 text-[13px] text-[var(--t2)]">
    {turn?.tools.map((tool) => <p key={tool.toolKey} role="status" className="flex items-center gap-2">
      {tool.state === "complete" ? <CheckIcon className="size-3.5 text-[var(--ok)]" /> : null}
      {t(`tools.${tool.state}`)}
    </p>)}
    {pending ? <p role="status">{t(turn?.phase === "writing" ? "status.writing" : "status.consulting")}</p> : null}
  </div>;
}
