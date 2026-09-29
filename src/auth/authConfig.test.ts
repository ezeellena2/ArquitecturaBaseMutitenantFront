import { describe, expect, it } from "vitest";
import { authConfig } from "./authConfig";

describe("authConfig", () => {
  it("usa el issuer principal y canjea el código en el origen propio", () => {
    expect(authConfig.authority).toBe("https://localhost:5174/");
    expect(authConfig.metadataUrl).toBe(`${location.origin}/.well-known/openid-configuration`);
    expect(authConfig.metadataSeed?.token_endpoint).toBe(`${location.origin}/connect/token`);
    expect(authConfig.metadataSeed?.userinfo_endpoint).toBe(`${location.origin}/connect/userinfo`);
    expect(authConfig.metadataSeed?.revocation_endpoint).toBe(`${location.origin}/connect/revocation`);
    expect(authConfig.client_id).toBe("web");
    expect(authConfig.response_type).toBe("code");
    expect(authConfig.scope).toContain("offline_access");
    expect(authConfig.automaticSilentRenew).toBe(false);
  });
});
