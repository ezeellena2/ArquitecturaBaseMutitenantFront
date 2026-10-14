import { describe, expect, it } from "vitest";
import { businessE6Admin } from "@/test/mocks/currentUsers";
import { businessGuard, personalGuard, platformGuard } from "./access";
import { whatsappMember, whatsappOperator, whatsappOwner, whatsappPerson } from "./test/support";

describe("guardas de WhatsApp", () => {
  it("la organización pide el módulo prendido y alguno de los permisos", () => {
    expect(businessGuard("whatsapp.customers")(whatsappOwner)).toBe("allowed");
    expect(businessGuard("whatsapp.customers", "whatsapp.internal")(whatsappMember("whatsapp.internal"))).toBe("allowed");
    expect(businessGuard("whatsapp.manage")(whatsappMember("whatsapp.customers"))).toBe("forbidden");
    // Sin la llave del módulo es un 404 aunque tenga el permiso, como el back.
    expect(businessGuard("whatsapp.customers")({ ...whatsappOwner, features: [] })).toBe("unavailable");
    expect(businessGuard("users.invite")(businessE6Admin)).toBe("unavailable");
    expect(businessGuard("whatsapp.customers")(whatsappOperator())).toBe("forbidden");
  });
  it("Plataforma no tiene llave por organización: decide el permiso del operador", () => {
    expect(platformGuard("platform.whatsapp.attend")(whatsappOperator("platform.whatsapp.attend"))).toBe("allowed");
    expect(platformGuard("platform.whatsapp.manage")(whatsappOperator("platform.whatsapp.attend"))).toBe("forbidden");
    expect(platformGuard("platform.whatsapp.attend")(whatsappOwner)).toBe("forbidden");
  });
  it("Mensajes del perfil personal solo pide el módulo", () => {
    expect(personalGuard(whatsappPerson)).toBe("allowed");
    expect(personalGuard({ ...whatsappPerson, features: [] })).toBe("unavailable");
    expect(personalGuard(whatsappOwner)).toBe("forbidden");
  });
});
