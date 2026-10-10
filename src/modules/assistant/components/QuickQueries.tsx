import { useTranslation } from "react-i18next";
import { AssistantRuntimeProvider, MessageNotSentError, SuggestionPrimitive, ThreadPrimitive, useExternalStoreRuntime, type ThreadMessageLike } from "@assistant-ui/react";
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
  const allowed = queries.filter(({ key }) => (keys[scope.access] as readonly string[]).includes(key));
  // Las sugerencias despachan claves del endpoint fijo; no son consultas al
  // proveedor ni consumen el borrador o los adjuntos de la caja principal.
  const runtime = useExternalStoreRuntime<ThreadMessageLike>({ messages: [], convertMessage: (message) => message, isSendDisabled: disabled,
    suggestions: allowed.map(({ key }) => ({ prompt: key, title: t(`quick.${key}`) })),
    onNew: async (message) => {
      const key = message.content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
      if (disabled || !allowed.some((item) => item.key === key)) throw new MessageNotSentError();
      onSelect(key);
    },
  });
  return <AssistantRuntimeProvider runtime={runtime}><div className="flex flex-wrap justify-center gap-2">
    <ThreadPrimitive.Suggestions>{() => <SuggestionPrimitive.Trigger send clearComposer={false} asChild><button type="button" disabled={disabled}
        className="min-h-[34px] rounded-full border border-[var(--borde)] bg-[var(--lado-activo)] px-3.5 text-[13.5px] text-[var(--t1)] hover:border-[var(--marca)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] max-md:min-h-11 disabled:opacity-50">
        <SuggestionPrimitive.Title />
      </button></SuggestionPrimitive.Trigger>}</ThreadPrimitive.Suggestions>
  </div></AssistantRuntimeProvider>;
}
