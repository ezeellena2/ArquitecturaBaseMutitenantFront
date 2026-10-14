import type { ModulePageAction, ModuleRoute } from "@/shared/modules/types";

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. */
export const phonesRoutes: readonly ModuleRoute[] = [];

/** «Cargar teléfonos» en la banda de Usuarios (y en su ⋮ del teléfono): se suma con su pantalla. */
export const phonesUsersActions: readonly ModulePageAction[] = [];
