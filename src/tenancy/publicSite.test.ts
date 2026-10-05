import { describe, expect, it } from "vitest";
import { publicSiteHost, publicSiteSuffix } from "./publicSite";

describe("publicSiteHost (E5)", () => {
  it("comparte la dirección y el sufijo de la página pública, conservando lo visible hasta E7", () => {
    expect(publicSiteHost("grupo-delta")).toBe("grupo-delta.plataforma.com");
    expect(publicSiteHost("otro-negocio")).toBe(`otro-negocio${publicSiteSuffix}`);
    expect(publicSiteHost("")).toBe(publicSiteSuffix);
  });
});
