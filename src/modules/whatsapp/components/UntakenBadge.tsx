import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMatch } from "react-router";
import { fetchPlatformUntaken, fetchUntaken, platformUntakenQueryKey, untakenQueryKey, untakenRefetchInterval } from "../api/untaken";

/** El contador de «WhatsApp» y de «Chats» (tableros WA-Chats y M-WA-Chats): la suma de las bandejas que la persona ve. */
export function UntakenBadge({ children }: { children: (count: number) => ReactNode }) {
  const inChatsList = Boolean(useMatch("/org/whatsapp/chats"));
  const inChatsDetail = Boolean(useMatch("/org/whatsapp/chats/:conversationId"));
  const inChats = inChatsList || inChatsDetail;
  const query = useQuery({
    queryKey: untakenQueryKey,
    queryFn: ({ signal }) => fetchUntaken(signal),
    enabled: !inChats,
    refetchInterval: inChats ? false : untakenRefetchInterval,
    refetchIntervalInBackground: false,
    meta: { silent: true },
  });
  const count = (query.data?.customers ?? 0) + (query.data?.internal ?? 0);
  return count > 0 ? children(count) : null;
}

/** El de «WhatsApp» y «Consultas» de Plataforma (Plat-WA-Chats y M-Mas-Plat). */
export function PlatformUntakenBadge({ children }: { children: (count: number) => ReactNode }) {
  const inChatsList = Boolean(useMatch("/plataforma/whatsapp"));
  const inChatsDetail = Boolean(useMatch("/plataforma/whatsapp/consultas/:conversationId"));
  const inChats = inChatsList || inChatsDetail;
  const query = useQuery({
    queryKey: platformUntakenQueryKey,
    queryFn: ({ signal }) => fetchPlatformUntaken(signal),
    enabled: !inChats,
    refetchInterval: inChats ? false : untakenRefetchInterval,
    refetchIntervalInBackground: false,
    meta: { silent: true },
  });
  const count = query.data ?? 0;
  return count > 0 ? children(count) : null;
}
