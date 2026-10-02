import { describe, expect, it } from "vitest";
import { loginReturnUrl, safeReturnUrl } from "./returnUrl";

describe("returnUrl", () => {
  it("admite la invitación exacta sin ampliar los retornos a rutas arbitrarias", () => {
    expect(loginReturnUrl("/invitacion")).toBe("/invitacion");
    for (const value of ["/invitacion/", "/invitacion?access=consumer", "/invitacion#token", "/org", "https://other.test/invitacion"]) {
      expect(loginReturnUrl(value)).toBeUndefined();
    }
  });
  it("conserva rutas internas y descarta destinos externos o inválidos", () => {
    expect(safeReturnUrl("/org/usuarios?pagina=2", "/org")).toBe("/org/usuarios?pagina=2");
    expect(safeReturnUrl("https://evil.example", "/org")).toBe("/org");
    expect(safeReturnUrl("//evil.example", "/org")).toBe("/org");
    expect(safeReturnUrl("/\\evil.example", "/org")).toBe("/org");
    expect(safeReturnUrl(null, "/org")).toBe("/org");
  });
});
