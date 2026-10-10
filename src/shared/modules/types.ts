import type { ComponentType, ReactNode } from "react";
import type { MeResponse } from "@/shared/api/types";
import type { IconComponent } from "@/shared/ui/icons";
import type { Access } from "@/tenancy/access";

export type ModuleAccess = "allowed" | "forbidden" | "unavailable";
export type ModuleGuard = (me: MeResponse) => ModuleAccess;
export interface ModuleContentProps {
  me: MeResponse;
  welcome?: ReactNode;
  banner?: ReactNode;
  children?: ReactNode;
}
export interface ModuleRoute {
  path: string;
  access: Access;
  guard: ModuleGuard;
  /** React.lazy se monta sólo después de resolver la guarda. Nunca route.lazy. */
  Page: ComponentType<ModuleContentProps>;
  navigation?: {
    labelKey: string;
    icon: IconComponent;
    placement: "phone" | "administration";
    section?: { labelKey: string; icon: IconComponent };
  };
}
export interface ModuleRegistration {
  id: string;
  routes: readonly ModuleRoute[];
  home?: { guard: ModuleGuard; Content: ComponentType<ModuleContentProps> };
}
