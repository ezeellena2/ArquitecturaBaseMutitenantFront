import type { ComponentType, ReactNode } from "react";
import type { MeResponse, PendingItem, PlatformFeatureResponse, PlatformTenantDetailResponse } from "@/shared/api/types";
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
/**
 * Un contador del menú (los chats sin tomar): el módulo lo lee y le pasa la cantidad a quien lo dibuja. Sin nada que
 * contar (cero, cargando o sin permiso) no llama a `children`.
 */
export type ModuleBadge = ComponentType<{ children: (count: number) => ReactNode }>;

/** El panel propio de un módulo de uso diario, al lado del menú lateral («Criterio · Menús»: WhatsApp, Formularios). */
export interface ModuleNavigationPanel {
  labelKey: string;
  icon: IconComponent;
  /** El contador del ítem del menú que abre el panel. */
  Badge?: ModuleBadge;
}

export interface ModuleRouteNavigation {
  labelKey: string;
  icon: IconComponent;
  /**
   * - `phone`: sólo una sección de la barra del teléfono (el Asistente; en la compu vive en el Inicio).
   * - `menu`: una opción del menú lateral, después de las del núcleo, y una sección de la barra del teléfono, después
   *   de las del núcleo («Mensajes» del perfil personal; «WhatsApp», que en Plataforma va directo a Consultas).
   * - `panel`: una opción del panel propio del módulo (`panel`). En el teléfono, una sección de la barra si `phone`;
   *   si no, una fila del grupo del módulo en Más, junto con su Administración (Chats y Contactos van en la barra;
   *   Difusiones, en Más › WhatsApp).
   * - `administration`: una opción de Administración, en el grupo `section` si lo tiene.
   */
  placement: "phone" | "menu" | "panel" | "administration";
  section?: { labelKey: string; icon: IconComponent };
  panel?: ModuleNavigationPanel;
  phone?: boolean;
  /** El rótulo de la barra del teléfono si el tablero la nombra distinto («Consultas» para «WhatsApp»). */
  phoneLabelKey?: string;
  /** El ícono de 24 de la barra del teléfono, si no es el del menú. */
  phoneIcon?: IconComponent;
  /** El contador de la opción (Chats y Consultas: los chats sin tomar). */
  Badge?: ModuleBadge;
}

export interface ModuleRoute {
  path: string;
  access: Access;
  guard: ModuleGuard;
  /** React.lazy se monta sólo después de resolver la guarda. Nunca route.lazy. */
  Page: ComponentType<ModuleContentProps>;
  navigation?: ModuleRouteNavigation;
}

/** Una acción que el módulo suma a la banda de una pantalla del núcleo («Cargar teléfonos» en Usuarios). */
export interface ModulePageAction {
  labelKey: string;
  to: string;
  guard: ModuleGuard;
}

/** La tarjeta de un área del módulo en el Inicio de la organización (`HomeResponse.moduleCards`, «WhatsApp · 2 números»). */
export interface ModuleHomeCard {
  /** La clave de `HomeModuleCard.key` que manda el back. */
  key: string;
  titleKey: string;
  /** Texto con `{{count}}` y plurales: «2 números». */
  detailKey: string;
  /** El rótulo corto de los atajos del teléfono (M-Inicio-Org). */
  shortKey: string;
  icon: IconComponent;
  to: string;
}

/** Cómo se lee un tipo de «Para resolver» que aporta el módulo (`PendingGroup.kind`, «Números sin medio de pago»). */
export interface ModulePendingKind {
  kind: string;
  /** La tarjeta del Inicio de la que es el pendiente: su rótulo y su ícono acompañan el grupo. */
  card: string;
  groupKey: string;
  stateKey: string;
  actionKey: string;
  /** El listado filtrado de «Ver todos». */
  to: string;
  /** La fila: lo que dice y adónde lleva su acción. */
  describe: (item: PendingItem) => { title: string; detail?: string; to: string };
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
  /** El nombre del módulo en la ficha de una organización (Plataforma › Módulos), aunque no aporte acciones propias. */
  nameKey?: string;
  organizationUi?: { nameKey: string; guard: ModuleGuard; Content: ComponentType<ModuleOrganizationUiProps> };
  /** Acciones en la banda de pantallas del núcleo, por pantalla. */
  pageActions?: { readonly users?: readonly ModulePageAction[] };
  /** Lo que el módulo suma al Inicio de la organización: sus tarjetas y sus tipos de «Para resolver». */
  businessHome?: { readonly cards?: readonly ModuleHomeCard[]; readonly pending?: readonly ModulePendingKind[] };
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
