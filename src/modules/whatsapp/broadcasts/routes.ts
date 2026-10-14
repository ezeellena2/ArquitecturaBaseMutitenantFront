import { lazy } from "react";
import type { ModuleRoute } from "@/shared/modules/types";
import { businessGuard } from "../access";
import { BroadcastsIcon } from "../components/icons";
import { whatsappPanel } from "../navigation";

const BroadcastsPage = lazy(() => import("./pages/BroadcastsPage").then((module) => ({ default: module.BroadcastsPage })));
const NewBroadcastPage = lazy(() => import("./pages/NewBroadcastPage").then((module) => ({ default: module.NewBroadcastPage })));
const BroadcastPage = lazy(() => import("./pages/BroadcastPage").then((module) => ({ default: module.BroadcastPage })));

const guard = businessGuard("whatsapp.broadcasts");

/**
 * Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. Difusiones no va
 * en la barra del teléfono: está en Más › WhatsApp. «Nueva difusión» es larga (plantilla, variables, a quiénes, cuándo y
 * la vista previa): va en su pantalla, como el tablero.
 */
export const broadcastsRoutes: readonly ModuleRoute[] = [
  {
    access: "business", path: "/org/whatsapp/difusiones", guard, Page: BroadcastsPage,
    navigation: { placement: "panel", panel: whatsappPanel, labelKey: "whatsapp:nav.broadcasts", icon: BroadcastsIcon },
  },
  { access: "business", path: "/org/whatsapp/difusiones/nueva", guard, Page: NewBroadcastPage },
  { access: "business", path: "/org/whatsapp/difusiones/:broadcastId", guard, Page: BroadcastPage },
];
