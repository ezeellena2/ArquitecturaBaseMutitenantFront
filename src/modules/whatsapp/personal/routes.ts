import { lazy } from "react";
import type { ModuleRoute } from "@/shared/modules/types";
import { personalGuard } from "../access";
import { AppChatsIcon, ChatsIcon } from "../components/icons";

// La lista y la conversación son la misma página: en la compu van lado a lado; en el teléfono, la conversación es otra
// pantalla con ‹ a la lista.
const Messages = lazy(() => import("./pages/MessagesPage").then((module) => ({ default: module.MessagesPage })));

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. */
export const personalRoutes: readonly ModuleRoute[] = [
  { access: "consumer", path: "/mensajes", guard: personalGuard, Page: Messages, navigation: {
    placement: "menu", labelKey: "whatsapp:nav.messages", icon: ChatsIcon, phoneIcon: AppChatsIcon,
  } },
  { access: "consumer", path: "/mensajes/:conversationId", guard: personalGuard, Page: Messages },
];
