import { lazy } from "react";
import { WhatsAppIcon } from "@/shared/ui/icons";
import type { ModuleRoute } from "@/shared/modules/types";
import { businessGuard } from "../access";
import { whatsappAdministration } from "../navigation";

const WhatsAppSettingsPage = lazy(() => import("./pages/WhatsAppSettingsPage").then((module) => ({ default: module.WhatsAppSettingsPage })));
const navigation = { placement: "administration", section: whatsappAdministration, labelKey: "whatsapp:nav.settings", icon: WhatsAppIcon } as const;

/** Administración › WhatsApp › Configuración (WA-Config-Base2), después de Plantillas: la lee quien lee la configuración de
 *  la organización y la cambia quien la cambia (B18). La de Plataforma es una sección de su Configuración. */
export const settingsRoutes: readonly ModuleRoute[] = [
  { access: "business", path: "/org/whatsapp/configuracion", guard: businessGuard("settings.read", "settings.manage"), Page: WhatsAppSettingsPage, navigation },
];
