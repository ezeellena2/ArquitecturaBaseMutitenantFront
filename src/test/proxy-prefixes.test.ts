import { afterEach, describe, expect, it, vi } from "vitest";
import configuration, { backendProxy } from "../../vite.config";

afterEach(() => vi.unstubAllEnvs());

describe("backend proxy prefixes", () => {
  it("el E2E aislado conserva la navegación al generar evidencias, sin recargas HMR", () => {
    vi.stubEnv("MT_E2E_ISOLATED", "1");
    const isolated = configuration({ command: "serve", mode: "development" });
    expect(isolated.server?.hmr).toBe(false);
    vi.stubEnv("MT_E2E_ISOLATED", "0");
    const development = configuration({ command: "serve", mode: "development" });
    expect(development.server?.hmr).not.toBe(false);
  });
  it("routes documentation only in development", () => {
    const development = backendProxy("development");
    const production = backendProxy("production");

    for (const prefix of ["/api", "/account", "/connect", "/health", "/alive"]) {
      expect(development).toHaveProperty(prefix);
      expect(production).toHaveProperty(prefix);
    }
    expect(development).toHaveProperty("/swagger");
    expect(development).toHaveProperty("/openapi");
    expect(production).not.toHaveProperty("/swagger");
    expect(production).not.toHaveProperty("/openapi");
  });
});
