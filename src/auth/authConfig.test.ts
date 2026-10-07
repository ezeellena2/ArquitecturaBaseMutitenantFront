import { describe, expect, it } from "vitest";
import { authConfig, createAuthConfig } from "./authConfig";

describe("authConfig", () => {
  it("usa el issuer principal y canjea el código en el origen propio", () => {
    expect(authConfig.authority).toBe("https://localtest.me:5174/");
    expect(authConfig.metadataUrl).toBe(`${location.origin}/.well-known/openid-configuration`);
    expect(authConfig.metadataSeed?.token_endpoint).toBe(`${location.origin}/connect/token`);
    expect(authConfig.metadataSeed?.userinfo_endpoint).toBe(`${location.origin}/connect/userinfo`);
    expect(authConfig.metadataSeed?.revocation_endpoint).toBe(`${location.origin}/connect/revoke`);
    expect(authConfig.client_id).toBe("web");
    expect(authConfig.response_type).toBe("code");
    expect(authConfig.scope).toContain("offline_access");
    expect(authConfig.automaticSilentRenew).toBe(false);
  });

  it("al salir vuelve a la portada pública", () => {
    expect(authConfig.post_logout_redirect_uri).toBe(`${location.origin}/`);
  });

  it("en el subdominio conserva la autoridad y usa su propio origen para callbacks y datos OIDC", () => {
    const origin = "https://grupo-delta.localtest.me:5174";
    const config = createAuthConfig(origin);
    expect(config.authority).toBe("https://localtest.me:5174/");
    expect(config.redirect_uri).toBe(`${origin}/auth/callback`);
    expect(config.silent_redirect_uri).toBe(`${origin}/silent-renew.html`);
    expect(config.post_logout_redirect_uri).toBe(`${origin}/`);
    expect(config.metadataUrl).toBe(`${origin}/.well-known/openid-configuration`);
    expect(config.metadataSeed?.token_endpoint).toBe(`${origin}/connect/token`);
    expect(config.metadataSeed?.userinfo_endpoint).toBe(`${origin}/connect/userinfo`);
    expect(config.metadataSeed?.revocation_endpoint).toBe(`${origin}/connect/revoke`);
  });
});
