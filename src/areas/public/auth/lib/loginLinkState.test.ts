import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { loginLinkErrorState, loginLinkToken, publicWhatsAppUrl, stripLoginLinkFragment } from "./loginLinkState";

describe("loginLinkState", () => {
  it("lee de forma pura y retira sólo el fragmento sin consumirlo en StrictMode", () => {
    history.replaceState({ previous: true }, "", "/login/enlace#t=opaque-secret");
    expect(loginLinkToken(location.hash)).toBe("opaque-secret");
    expect(loginLinkToken(location.hash)).toBe("opaque-secret");
    stripLoginLinkFragment();
    expect(location.hash).toBe(""); expect(history.state).toEqual({ previous: true });
    history.replaceState(null, "", "/");
  });
  it("construye WhatsApp sólo a partir de un teléfono público E.164", () => {
    expect(publicWhatsAppUrl("+5491123456789")).toBe("https://wa.me/5491123456789");
    for (const phone of [undefined, null, "", "123456", "phone-number-id", "•••• 6789"]) expect(publicWhatsAppUrl(phone)).toBeNull();
  });
  it.each(["Auth.LoginLink.Invalid", "Auth.LoginLink.Expired", "Auth.LoginLink.AlreadyUsed"])("%s comparte el estado inválido", (code) => {
    expect(loginLinkErrorState(new ApiError(400, { code }))).toBe("invalid");
  });
  it.each([403, 429])("LockedOut es terminal por código con status %s", (status) => {
    expect(loginLinkErrorState(new ApiError(status, { code: "Identity.Account.LockedOut", detail: "Esperá antes de ingresar." }))).toBe("terminal");
  });
  it("suspensión conserva el estado terminal", () => {
    expect(loginLinkErrorState(new ApiError(403, { code: "Identity.Account.Suspended" }))).toBe("terminal");
  });
  it.each(["Auth.LoginLink.TooManyRequests", "Request.TooManyRequests"])("%s sigue recuperable aunque su detalle mencione el bloqueo", (code) => {
    expect(loginLinkErrorState(new ApiError(429, { code, detail: "Identity.Account.LockedOut" }))).toBe("retry");
  });
  it.each([ApiError.network(), new ApiError(503, { code: "General.Unexpected" })])("un error transitorio conserva reintento", (error) => {
    expect(loginLinkErrorState(error)).toBe("retry");
  });
});
