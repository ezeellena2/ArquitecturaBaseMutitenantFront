import { lazy } from "react";
import type { ModuleRoute } from "@/shared/modules/types";
import { WhatsAppIcon } from "@/shared/ui/icons";
import { businessGuard, platformGuard } from "../access";
import { AppChatsIcon, ChatsIcon } from "../components/icons";
import { PlatformUntakenBadge, UntakenBadge } from "../components/UntakenBadge";
import { whatsappPanel } from "../navigation";

// La lista y la conversación abierta son la misma página: en la compu van lado a lado y la bandeja no se vuelve a montar
// al abrir otro chat; en el teléfono, la conversación es otra pantalla con ‹ a la bandeja.
const Chats = lazy(() => import("./pages/ChatsPage").then((module) => ({ default: module.ChatsPage })));
const PlatformChats = lazy(() => import("./pages/ChatsPage").then((module) => ({ default: module.PlatformChatsPage })));
const chatsGuard = businessGuard("whatsapp.customers", "whatsapp.internal");
const consultationsGuard = platformGuard("platform.whatsapp.attend");

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. */
export const chatsRoutes: readonly ModuleRoute[] = [
  { access: "business", path: "/org/whatsapp/chats", guard: chatsGuard, Page: Chats, navigation: {
    placement: "panel", panel: whatsappPanel, phone: true, labelKey: "whatsapp:nav.chats", icon: ChatsIcon, phoneIcon: AppChatsIcon, Badge: UntakenBadge,
  } },
  { access: "business", path: "/org/whatsapp/chats/:conversationId", guard: chatsGuard, Page: Chats },
  { access: "platform", path: "/plataforma/whatsapp", guard: consultationsGuard, Page: PlatformChats, navigation: {
    placement: "menu", labelKey: "whatsapp:title", phoneLabelKey: "whatsapp:nav.consultations", icon: WhatsAppIcon, phoneIcon: AppChatsIcon, Badge: PlatformUntakenBadge,
  } },
  { access: "platform", path: "/plataforma/whatsapp/consultas/:conversationId", guard: consultationsGuard, Page: PlatformChats },
];
