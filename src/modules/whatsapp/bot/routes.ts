import { lazy } from "react";
import { WhatsAppIcon } from "@/shared/ui/icons";
import type { ModuleRoute } from "@/shared/modules/types";
import { businessGuard, platformGuard } from "../access";
import { whatsappAdministration } from "../navigation";

const BotPage = lazy(() => import("./pages/BotPage").then((module) => ({ default: module.BotPage })));
const PlatformBotPage = lazy(() => import("./pages/PlatformBotPage").then((module) => ({ default: module.PlatformBotPage })));
const navigation = { placement: "administration", section: whatsappAdministration, labelKey: "whatsapp:nav.bot", icon: WhatsAppIcon } as const;

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. */
export const botRoutes: readonly ModuleRoute[] = [
  { access: "business", path: "/org/whatsapp/bot", guard: businessGuard("whatsapp.manage"), Page: BotPage, navigation },
  { access: "platform", path: "/plataforma/whatsapp/bot", guard: platformGuard("platform.whatsapp.manage"), Page: PlatformBotPage, navigation },
];
