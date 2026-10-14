import { lazy } from "react";
import { WhatsAppIcon } from "@/shared/ui/icons";
import type { ModuleRoute, ModuleRouteNavigation } from "@/shared/modules/types";
import { businessGuard, platformGuard } from "../access";
import { whatsappAdministration } from "../navigation";

const OrganizationTemplates = lazy(() => import("./pages/TemplatesPage").then((module) => ({ default: module.OrganizationTemplatesPage })));
const PlatformTemplates = lazy(() => import("./pages/TemplatesPage").then((module) => ({ default: module.PlatformTemplatesPage })));

const navigation: ModuleRouteNavigation = { placement: "administration", section: whatsappAdministration, labelKey: "whatsapp:nav.templates", icon: WhatsAppIcon };

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. «Nueva
 *  plantilla» es un diálogo de la lista (WA-Plantilla-Nueva): no tiene ruta propia. */
export const templatesRoutes: readonly ModuleRoute[] = [
  { access: "business", path: "/org/whatsapp/plantillas", guard: businessGuard("whatsapp.manage"), Page: OrganizationTemplates, navigation },
  { access: "platform", path: "/plataforma/whatsapp/plantillas", guard: platformGuard("platform.whatsapp.manage"), Page: PlatformTemplates, navigation },
];
