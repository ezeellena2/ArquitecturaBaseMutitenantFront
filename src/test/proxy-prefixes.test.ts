import { describe, expect, it } from "vitest";
import { backendProxy } from "../../vite.config";

describe("backend proxy prefixes", () => {
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
