import { describe, expect, it } from "vitest";
import { permissionsOf } from "@/auth/usePermissions";
import { assistantRegistration } from "@/modules/assistant/registration";
import { businessNavigation } from "@/layouts/navigation/business";
import { personalNavigation } from "@/layouts/navigation/personal";
import { platformNavigationWithHome } from "@/layouts/navigation/platform";
import { composeNavigation } from "@/layouts/navigation/useNavigation";
import type { MeResponse } from "@/shared/api/types";
import { whatsappRegistration } from "./registration";
import { whatsappMember, whatsappOperator, whatsappOwner, whatsappPerson } from "./test/support";

const modules = [whatsappRegistration, assistantRegistration];
const withAssistant = (me: MeResponse): MeResponse => me.access === "platform"
  ? { ...me, effectivePermissions: { ...me.effectivePermissions, platform: [...me.effectivePermissions.platform, "platform.assistant.use"] }, moduleCapabilities: [{ key: "assistant", available: true, canConfigure: false, canReadUsage: false }] }
  : { ...me, features: [...me.features, "assistant"], effectivePermissions: { ...me.effectivePermissions, organization: [...me.effectivePermissions.organization, "assistant.use", "assistant.configure"] } };
const paths = (links: readonly { path: string }[] | undefined) => links?.map((link) => link.path);
const compose = (base: Parameters<typeof composeNavigation>[0], me: MeResponse) => composeNavigation(base, me.access, me, permissionsOf(me), modules);

describe("navegación de WhatsApp con su registro real", () => {
  it("la Dueña ve el panel WhatsApp, Administración › WhatsApp y la barra de M-WA-Menu", () => {
    const nav = compose(businessNavigation, withAssistant(whatsappOwner));
    expect(nav.panels?.map((panel) => [panel.labelKey, paths(panel.links)])).toEqual([["whatsapp:title", ["/org/whatsapp/chats", "/org/whatsapp/contactos", "/org/whatsapp/difusiones"]]]);
    expect(paths(nav.administration?.sections?.find((section) => section.labelKey === "whatsapp:title")?.links))
      .toEqual(["/org/whatsapp/numeros", "/org/whatsapp/bot", "/org/whatsapp/equipos", "/org/whatsapp/plantillas"]);
    // M-WA-Menu: Inicio, Asistente, Chats, Contactos y Más; Difusiones va en Más › WhatsApp, antes de su Administración.
    expect(nav.bottomSections?.map((section) => section.link.path)).toEqual(["/org", "/org/asistente", "/org/whatsapp/chats", "/org/whatsapp/contactos"]);
    expect(nav.administration?.sections?.filter((section) => section.moreGroup).map((section) => section.labelKey)).toEqual(["whatsapp:title", "assistant:title"]);
  });

  it("cada opción pide su permiso: quien solo atiende internos ve Chats y nada de Administración", () => {
    const nav = compose(businessNavigation, whatsappMember("whatsapp.internal"));
    expect(nav.panels?.map((panel) => paths(panel.links))).toEqual([["/org/whatsapp/chats"]]);
    expect(nav.administration?.sections?.find((section) => section.labelKey === "whatsapp:title")).toBeUndefined();
    expect(compose(businessNavigation, { ...whatsappOwner, features: [] }).panels).toBeUndefined();
  });

  it("Plataforma: «WhatsApp» directo a Consultas y «Consultas» al final de la barra (Plat-WA-Chats, M-Mas-Plat)", () => {
    const nav = compose(platformNavigationWithHome, withAssistant(whatsappOperator()));
    expect(paths(nav.links)).toEqual(["/plataforma", "/plataforma/whatsapp"]);
    expect(nav.bottomSections?.map((section) => section.link.path)).toEqual(["/plataforma/organizaciones", "/plataforma/asistente", "/plataforma/cuentas", "/plataforma/whatsapp"]);
    expect(nav.bottomSections?.at(-1)?.link.phoneLabelKey).toBe("whatsapp:nav.consultations");
    expect(paths(nav.administration?.sections?.find((section) => section.labelKey === "whatsapp:title")?.links))
      .toEqual(["/plataforma/whatsapp/numero", "/plataforma/whatsapp/bot", "/plataforma/whatsapp/equipos", "/plataforma/whatsapp/plantillas"]);
    expect(paths(compose(platformNavigationWithHome, whatsappOperator("platform.whatsapp.manage")).links)).toEqual(["/plataforma"]);
  });

  it("el perfil personal suma «Mensajes» entre Inicio y Mi cuenta, y en la barra después del Asistente (WA-Mensajes)", () => {
    const nav = compose(personalNavigation, withAssistant(whatsappPerson));
    expect(paths(nav.links)).toEqual(["/", "/mensajes", "/cuenta"]);
    expect(nav.bottomSections?.map((section) => section.link.path)).toEqual(["/", "/asistente", "/mensajes"]);
  });
});
