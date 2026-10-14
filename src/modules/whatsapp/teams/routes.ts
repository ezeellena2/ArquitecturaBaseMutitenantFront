import { lazy } from "react";
import { WhatsAppIcon } from "@/shared/ui/icons";
import type { ModuleRoute, ModuleRouteNavigation } from "@/shared/modules/types";
import { businessGuard, platformGuard } from "../access";
import { whatsappAdministration } from "../navigation";

const OrganizationTeams = lazy(() => import("./pages/TeamsPage").then((module) => ({ default: module.OrganizationTeamsPage })));
const PlatformTeams = lazy(() => import("./pages/TeamsPage").then((module) => ({ default: module.PlatformTeamsPage })));

const navigation: ModuleRouteNavigation = { placement: "administration", section: whatsappAdministration, labelKey: "whatsapp:nav.teams", icon: WhatsAppIcon };

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. */
export const teamsRoutes: readonly ModuleRoute[] = [
  { access: "business", path: "/org/whatsapp/equipos", guard: businessGuard("whatsapp.manage"), Page: OrganizationTeams, navigation },
  { access: "platform", path: "/plataforma/whatsapp/equipos", guard: platformGuard("platform.whatsapp.manage"), Page: PlatformTeams, navigation },
];
