import { beforeEach, describe, expect, it } from "vitest";
import { mainSiteHost, publicSiteHost } from "@/tenancy/publicSite";
import { recoveryAccess, rememberRecoveryAccess } from "./recoveryAccess";

describe("recoveryAccess", () => {
  beforeEach(() => sessionStorage.clear());

  it.each(["business", "platform"])("storefront siempre pide Consumer aunque el último acceso sea %s", (access) => {
    rememberRecoveryAccess(access);
    for (const path of ["/", "/cuenta", "/org", "/plataforma"]) {
      expect(recoveryAccess(path, publicSiteHost("grupo-delta"))).toBe("consumer");
    }
  });

  it("el principal conserva rutas privadas explícitas y el acceso previo de cuenta", () => {
    rememberRecoveryAccess("platform");
    expect(recoveryAccess("/cuenta", mainSiteHost)).toBe("platform");
    expect(recoveryAccess("/org", mainSiteHost)).toBe("business");
    expect(recoveryAccess("/", mainSiteHost)).toBe("consumer");
  });
});
