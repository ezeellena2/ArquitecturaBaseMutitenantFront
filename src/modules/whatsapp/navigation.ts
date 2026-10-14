import { WhatsAppIcon } from "@/shared/ui/icons";
import type { ModuleNavigationPanel } from "@/shared/modules/types";
import { UntakenBadge } from "./components/UntakenBadge";

/// El panel WhatsApp de la organización (WA-Chats): Chats, Contactos y Difusiones. El ítem del menú lleva los sin tomar.
/// Todas las rutas del panel usan este mismo objeto, y el grupo de Más se llama igual.
export const whatsappPanel: ModuleNavigationPanel = { labelKey: "whatsapp:title", icon: WhatsAppIcon, Badge: UntakenBadge };

/// Administración › WhatsApp (WA-Admin y Plat-WA-Numero): Números o Número, Bot, Equipos y Plantillas.
export const whatsappAdministration = { labelKey: "whatsapp:title", icon: WhatsAppIcon } as const;
