import es from "./locales/es/forms.json";
import en from "./locales/en/forms.json";
import esEnums from "./locales/es/enums.json";
import enEnums from "./locales/en/enums.json";
import { lazy } from "react";
import { withAssistantProposal, type AssistantActionAdapter } from "@/shared/assistant-actions";
import type { ModuleGuard, ModuleNavigationPanel, ModuleRegistration } from "@/shared/modules/types";
import { CatalogsIcon, FormsIcon } from "./components/icons";

/** La llave del módulo por organización (`[FeatureGate("forms")]`): apagada, las rutas son un 404. */
export const formsFeature = "forms";

/** Los permisos de la organización del módulo: «Administrar catálogos» incluye «Ver catálogos» (260). */
export const formsPermissions = ["formcatalogs.read", "formcatalogs.manage"] as const;
export type FormsPermission = (typeof formsPermissions)[number];

/** Una pantalla de Catálogos: Empresa, el módulo prendido y el permiso efectivo, nunca roles. */
export function catalogsGuard(permission: FormsPermission): ModuleGuard {
  return (me) => me.access !== "business" ? "forbidden" : !me.features.includes(formsFeature) ? "unavailable"
    : me.effectivePermissions.organization.includes(permission) ? "allowed" : "forbidden";
}

/// El panel «Gestión de formularios» (34 y 78): en esta etapa tiene solo «Catálogos». En el teléfono, su grupo de Más.
export const formsPanel: ModuleNavigationPanel = { labelKey: "forms:nav.management", icon: FormsIcon };

/** El listado de catálogos: la entrada del panel y adonde vuelve el editor. */
export const catalogsPath = "/org/formularios/catalogos";

const CatalogsPage = lazy(() => import("./pages/CatalogsPage").then((module) => ({ default: module.CatalogsPage })));
const CatalogEditorPage = lazy(() => import("./pages/CatalogEditorPage").then((module) => ({ default: module.CatalogEditorPage })));
const read = catalogsGuard("formcatalogs.read");
const catalogPath = (id: string) => `${catalogsPath}/${encodeURIComponent(id)}`;

/**
 * Las acciones del asistente de Formularios (ADR 0068, §17): cambiar las opciones de un catálogo a mano se confirma en su
 * editor, con lo propuesto cargado y sin guardar, y la tarjeta aplicada lleva al catálogo.
 */
export const formsAssistantActions: readonly AssistantActionAdapter[] = [
  {
    action: "catalogoptions.edit@1",
    href: (proposal) => withAssistantProposal(proposal.target ? catalogPath(proposal.target.id) : catalogsPath, proposal.id),
    appliedHref: (proposal) => (proposal.target ? catalogPath(proposal.target.id) : undefined),
  },
];

export const formsRegistration: ModuleRegistration = {
  id: "forms",
  nameKey: "forms:title",
  resources: { es: { forms: es, enums: esEnums }, en: { forms: en, enums: enEnums } },
  permissions: { organization: formsPermissions, platform: [] },
  routes: [
    { access: "business", path: catalogsPath, guard: read, Page: CatalogsPage,
      navigation: { placement: "panel", panel: formsPanel, labelKey: "forms:nav.catalogs", icon: CatalogsIcon } },
    // «Nuevo catálogo» abre el editor y «Crear catálogo» manda el POST, que pide administrar (como «Nuevo rol» pide roles.manage).
    { access: "business", path: `${catalogsPath}/nuevo`, guard: catalogsGuard("formcatalogs.manage"), Page: CatalogEditorPage },
    { access: "business", path: `${catalogsPath}/:id`, guard: read, Page: CatalogEditorPage },
  ],
  assistantActions: formsAssistantActions,
};
