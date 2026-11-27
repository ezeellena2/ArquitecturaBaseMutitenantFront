import { describe, expect, it } from "vitest";
import { moduleComposition } from "@/app/moduleComposition";
import { permissionsOf } from "@/auth/usePermissions";
import { businessNavigation } from "@/layouts/navigation/business";
import { platformNavigationWithHome } from "@/layouts/navigation/platform";
import { personalNavigation } from "@/layouts/navigation/personal";
import { composeNavigation } from "@/layouts/navigation/useNavigation";
import type { MeResponse } from "@/shared/api/types";
import { businessE6Admin, consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";

// La Dueña con WhatsApp prendido y sus cuatro permisos, sin importar nada del otro módulo.
const whatsappOwner: MeResponse = { ...businessE6Admin, features: ["whatsapp"], effectivePermissions: { ...businessE6Admin.effectivePermissions,
  organization: [...businessE6Admin.effectivePermissions.organization, "whatsapp.customers", "whatsapp.internal", "whatsapp.broadcasts", "whatsapp.manage"] } };

const withForms = (me: MeResponse, ...permissions: string[]): MeResponse => ({ ...me, features: [...me.features, "forms"],
  effectivePermissions: { ...me.effectivePermissions, organization: [...me.effectivePermissions.organization, ...permissions] } });
const compose = (base: Parameters<typeof composeNavigation>[0], me: MeResponse) => composeNavigation(base, me.access, me, permissionsOf(me), moduleComposition);
const panels = (nav: ReturnType<typeof compose>) => nav.panels?.map((panel) => [panel.labelKey, panel.links.map((link) => link.path)]);

describe("navegación de Formularios con el registro real", () => {
  it("«Gestión de formularios» va después de WhatsApp, con solo «Catálogos», y no entra en la barra del teléfono", () => {
    const nav = compose(businessNavigation, withForms(whatsappOwner, "formcatalogs.read"));
    expect(panels(nav)).toEqual([
      ["whatsapp:title", ["/org/whatsapp/chats", "/org/whatsapp/contactos", "/org/whatsapp/difusiones"]],
      ["forms:nav.management", ["/org/formularios/catalogos"]],
    ]);
    // En el teléfono, Catálogos es una fila del grupo «Gestión de formularios» de Más (M-WA-Menu).
    expect(nav.bottomSections?.map((section) => section.link.path)).not.toContain("/org/formularios/catalogos");
    expect(nav.administration?.sections?.find((section) => section.labelKey === "forms:nav.management")).toBeUndefined();
  });

  it("sin el módulo o sin «Ver catálogos» no hay panel", () => {
    expect(panels(compose(businessNavigation, { ...withForms(whatsappOwner, "formcatalogs.read"), features: ["whatsapp"] })))
      .toEqual([["whatsapp:title", ["/org/whatsapp/chats", "/org/whatsapp/contactos", "/org/whatsapp/difusiones"]]]);
    expect(panels(compose(businessNavigation, withForms(whatsappOwner)))?.map(([key]) => key)).toEqual(["whatsapp:title"]);
  });

  it("Personal y Plataforma no reciben el panel", () => {
    expect(compose(personalNavigation, withForms(consumerWithoutOrganizations, "formcatalogs.read")).panels).toBeUndefined();
    expect(compose(platformNavigationWithHome, withForms(platformOperator, "formcatalogs.read")).panels).toBeUndefined();
  });
});
