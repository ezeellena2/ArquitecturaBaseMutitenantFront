import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { resolveConfig } from "vite";
import { authConfig } from "./authConfig";

const { callback, settings } = vi.hoisted(() => ({
  callback: vi.fn(),
  settings: vi.fn(),
}));

vi.mock("oidc-client-ts", async (importOriginal) => ({
  ...await importOriginal<typeof import("oidc-client-ts")>(),
  UserManager: class {
    constructor(config: unknown) { settings(config); }
    signinSilentCallback = callback;
  },
}));

describe("renovación silenciosa", () => {
  it("completa el callback OIDC desde el origen propio", async () => {
    await import("../silent-renew");

    expect(settings).toHaveBeenCalledWith(authConfig);
    expect(authConfig.silent_redirect_uri).toBe(`${location.origin}/silent-renew.html`);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("incluye la página del iframe como entrada de build", async () => {
    const config = await resolveConfig({}, "build", "production");
    expect(config.build.rolldownOptions?.input).toMatchObject({
      silentRenew: path.resolve(import.meta.dirname, "../../silent-renew.html"),
    });
  });
});
