import { lazy } from "react";
import { WhatsAppIcon } from "@/shared/ui/icons";
import type { ModuleRoute } from "@/shared/modules/types";
import { businessGuard, platformGuard } from "../access";
import { whatsappAdministration } from "../navigation";

const NumbersPage = lazy(() => import("./pages/NumbersPage").then((module) => ({ default: module.NumbersPage })));
const PlatformNumberPage = lazy(() => import("./pages/PlatformNumberPage").then((module) => ({ default: module.PlatformNumberPage })));

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. */
export const numbersRoutes: readonly ModuleRoute[] = [
  { access: "business", path: "/org/whatsapp/numeros", guard: businessGuard("whatsapp.manage"), Page: NumbersPage,
    navigation: { placement: "administration", section: whatsappAdministration, labelKey: "whatsapp:nav.numbers", icon: WhatsAppIcon } },
  { access: "platform", path: "/plataforma/whatsapp/numero", guard: platformGuard("platform.whatsapp.manage"), Page: PlatformNumberPage,
    navigation: { placement: "administration", section: whatsappAdministration, labelKey: "whatsapp:nav.number", icon: WhatsAppIcon } },
];
