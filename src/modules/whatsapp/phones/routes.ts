import { lazy } from "react";
import type { ModulePageAction, ModuleRoute } from "@/shared/modules/types";
import { businessGuard } from "../access";

const loadPhonesPath = "/org/usuarios/cargar-telefonos";
const LoadPhones = lazy(() => import("./pages/LoadPhonesPage").then((module) => ({ default: module.LoadPhonesPage })));

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. «Cargar
 *  teléfonos» cuelga de Usuarios (las migas terminan en «Usuarios / Cargar teléfonos»): no lleva opción propia. */
export const phonesRoutes: readonly ModuleRoute[] = [
  { access: "business", path: loadPhonesPath, guard: businessGuard("users.invite"), Page: LoadPhones },
];

/** «Cargar teléfonos» en la banda de Usuarios (y en su ⋮ del teléfono): se suma con su pantalla. */
export const phonesUsersActions: readonly ModulePageAction[] = [
  { labelKey: "whatsapp:users.loadPhones", to: loadPhonesPath, guard: businessGuard("users.invite") },
];
