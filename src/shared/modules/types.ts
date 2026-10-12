import type { ComponentType, ReactNode } from "react";
import type { MeResponse, PlatformFeatureResponse, PlatformTenantDetailResponse } from "@/shared/api/types";
import type { RowAction } from "@/shared/ui/RowActions";
import type { IconComponent } from "@/shared/ui/icons";
import type { Access } from "@/tenancy/access";

export type ModuleAccess = "allowed" | "forbidden" | "unavailable";
export type ModuleGuard = (me: MeResponse) => ModuleAccess;
export interface ModuleContentProps {
  me: MeResponse;
  welcome?: ReactNode;
  banner?: ReactNode;
  /** Devuelve al núcleo si el módulo dejó de estar disponible durante la sesión. */
  onUnavailable?: () => void;
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
  /** Textos propios, también enums aportados al namespace compartido. */
  resources?: Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, unknown>>>>>>;
  /** Datos exclusivos del arnés, cargados sólo por sus consumidores de prueba. */
  fixtures?: () => Promise<{ scenario: (board: string, state: string) => unknown }>;
  /** Códigos propios para la paridad del catálogo completo, sin ampliar las uniones del núcleo. */
  permissions?: {
    readonly organization: readonly string[];
    readonly platform: readonly string[];
  };
  routes: readonly ModuleRoute[];
  home?: { guard: ModuleGuard; Content: ComponentType<ModuleContentProps> };
  organizationUi?: { nameKey: string; guard: ModuleGuard; Content: ComponentType<ModuleOrganizationUiProps> };
}

export interface ModuleOrganizationUi {
  description?: ReactNode;
  actions?: readonly RowAction[];
  dialog?: ReactNode;
}

/** El módulo tipa su propia respuesta. El núcleo sólo conserva la base opaca entre pestañas. */
export interface ModuleOrganizationUiProps {
  me: MeResponse;
  organization: PlatformTenantDetailResponse;
  feature: PlatformFeatureResponse;
  /** Revalida los recursos del núcleo justo antes de enviar o aceptar una respuesta. */
  isCurrent: () => boolean;
  ownWrite: unknown;
  onWrite: (write: unknown) => void;
  onConflict: () => void;
  dialogOpen: boolean;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
  children: (ui: ModuleOrganizationUi) => ReactNode;
}
