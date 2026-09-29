import { describe, expect, it } from "vitest";
import { safeReturnUrl } from "./returnUrl";

describe("returnUrl", () => {
  it("conserva rutas internas y descarta destinos externos o inválidos", () => {
    expect(safeReturnUrl("/org/usuarios?pagina=2", "/org")).toBe("/org/usuarios?pagina=2");
    expect(safeReturnUrl("https://evil.example", "/org")).toBe("/org");
    expect(safeReturnUrl("//evil.example", "/org")).toBe("/org");
    expect(safeReturnUrl("/\\evil.example", "/org")).toBe("/org");
    expect(safeReturnUrl(null, "/org")).toBe("/org");
  });
});
